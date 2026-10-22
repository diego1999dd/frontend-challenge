import { delay, http, HttpResponse } from 'msw'
import type { Collector, Network, Order, Wallet } from '@/features/account/contracts'
import {
	database,
	saveDatabase,
	passwordHash,
	publicUser,
	sessionUser,
	storedCart,
	cartOwner,
	cartItems,
	stock,
	createQuote,
	cartFingerprint,
	settleOrder,
	validCollector,
	tokenKey,
	databaseKey,
} from './database'
import { broadcastOrderUpdate, broadcastNftUpdate, disconnectClients } from './realtime'

export class ApiFault extends Error {
	constructor(
		public status: number,
		public code: string,
		message: string,
		public fields?: Record<string, string>,
	) {
		super(message)
	}
}
const fail = (
	status: number,
	code: string,
	message: string,
	fields?: Record<string, string>,
): never => {
	throw new ApiFault(status, code, message, fields)
}
const validation = (fields: Record<string, string>) =>
	fail(422, 'VALIDATION', 'Confira os campos indicados.', fields)
const emailValid = (value: string) => /^\S+@\S+\.\S+$/.test(value)
const passwordValid = (value: string) =>
	value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)
type Db = Awaited<ReturnType<typeof database>>
function requireUser(db: Db, request: Request) {
	return (
		sessionUser(db, request) ??
		fail(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
	)
}
const networks: Network[] = ['ethereum', 'polygon', 'solana']
function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical)
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.entries(value)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, item]) => [key, canonical(item)]),
		)
	return value
}

// All business fixtures and failures stay at the network boundary.
function endpoint(
	method: 'get' | 'post' | 'put' | 'delete',
	path: string,
	fn: (
		request: Request,
		params: Record<string, string | readonly string[] | undefined>,
		db: Db,
	) => Promise<Response> | Response,
) {
	return http[method](`/api${path}`, async ({ request, params }) => {
		try {
			let db = await database()
			if (!path.startsWith('/demo')) {
				if (db.scenario === 'offline') return HttpResponse.error()
				if (db.scenario === 'http-error')
					return HttpResponse.json(
						{ code: 'UNAVAILABLE', message: 'Serviço temporariamente indisponível.' },
						{ status: 503 },
					)
				await delay(db.scenario === 'slow' ? 1800 : 100)
				db = await database()
			}
			// Serialize local database operations across requests/tabs. No response may
			// write an older snapshot over a completed payment or a profile mutation.
			const response = await navigator.locks.request('kurio-mock-database', async () =>
				fn(request, params, await database()),
			)
			if (response.headers.get('X-Demo-Timeout') === 'true') {
				await delay(11_000)
				return HttpResponse.error()
			}
			return response
		} catch (error) {
			if (error instanceof ApiFault)
				return HttpResponse.json(
					{ code: error.code, message: error.message, fields: error.fields },
					{ status: error.status },
				)
			if (error instanceof SyntaxError)
				return HttpResponse.json(
					{ code: 'BAD_REQUEST', message: 'Corpo da requisição inválido.' },
					{ status: 400 },
				)
			throw error
		}
	})
}
async function login(db: Db, request: Request, user: Db['users'][number]) {
	const guest = storedCart(db, `guest:${request.headers.get('x-visitor-id') || 'anonymous'}`)
	const cart = storedCart(db, user.id)
	for (const item of guest.items) {
		const current = cart.items.find((line) => line.id === item.id)
		const nft = db.nfts.find((nft) => nft.id === item.nftId)
		if (!nft) continue
		const quantity = Math.min(stock(nft, item.edition), item.quantity + (current?.quantity ?? 0))
		if (current) current.quantity = quantity
		else if (quantity) cart.items.push({ ...item, quantity })
	}
	if (!cart.coupon) cart.coupon = guest.coupon
	guest.items = []
	guest.coupon = ''
	cart.revision += 1
	const token = crypto.randomUUID()
	const expiresAt = Date.now() + 30 * 60_000
	db.sessions[token] = { userId: user.id, expiresAt }
	saveDatabase(db)
	return HttpResponse.json({ token, user: publicUser(user), expiresAt })
}
function publish(order: Order) {
	broadcastOrderUpdate({
		eventId: `${order.id}:${order.version}`,
		resourceId: order.id,
		userId: order.userId,
		version: order.version,
		order,
	})
	if (order.status === 'confirmed')
		void database().then((db) =>
			order.quote.items.forEach((item) => {
				const nft = db.nfts.find((nft) => nft.id === item.nftId)
				if (nft)
					broadcastNftUpdate({
						eventId: `${nft.id}:${nft.version}`,
						resourceId: nft.id,
						version: nft.version,
						nft,
					})
			}),
		)
}
function scheduleOrder(id: string, readyAt: number) {
	setTimeout(
		() => {
			void navigator.locks.request('kurio-mock-database', async () => {
				const db = await database()
				const order = db.orders[id]
				if (order && settleOrder(db, order)) {
					saveDatabase(db)
					publish(order)
				}
			})
		},
		Math.max(0, readyAt - Date.now()) + 20,
	)
}

export const accountHandlers = [
	endpoint('post', '/demo/reset', async () => {
		for (const key of Object.keys(localStorage))
			if (
				key === databaseKey ||
				key === tokenKey ||
				key === 'kurio-demo-visitor' ||
				key.startsWith('kurio-checkout:') ||
				key.startsWith('kurio-attempt:')
			)
				localStorage.removeItem(key)
		await database()
		return HttpResponse.json({ reset: true })
	}),
	endpoint('post', '/demo/socket/disconnect', () => {
		disconnectClients()
		return HttpResponse.json({ disconnected: true })
	}),
	endpoint('post', '/demo/orders/:id/replay', (request, params, db) => {
		const user = requireUser(db, request)
		const order = db.orders[String(params.id)]
		if (!order || order.userId !== user.id) fail(404, 'NOT_FOUND', 'Pedido não encontrado.')
		publish(order)
		broadcastOrderUpdate({
			eventId: `${order.id}:stale`,
			resourceId: order.id,
			userId: order.userId,
			version: 1,
			order: { ...order, version: 1, status: 'pending' },
		})
		return HttpResponse.json({ replayed: true })
	}),
	endpoint('get', '/session', (request, _, db) => {
		const user = sessionUser(db, request)
		if (request.headers.has('authorization') && !user) requireUser(db, request)
		const token = request.headers.get('authorization')?.replace('Bearer ', '')
		return HttpResponse.json({
			user: user ? publicUser(user) : null,
			expiresAt: token ? db.sessions[token]?.expiresAt : undefined,
		})
	}),
	endpoint('post', '/session', async (request, _, db) => {
		const body = (await request.json()) as { email: string; password: string }
		const user = db.users.find((user) => user.email === String(body.email).trim().toLowerCase())
		if (!user || user.passwordHash !== (await passwordHash(String(body.password), user.salt)))
			fail(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
		return login(db, request, user!)
	}),
	endpoint('post', '/accounts', async (request, _, db) => {
		const body = (await request.json()) as {
			username: string
			email: string
			password: string
			confirmPassword: string
		}
		const fields: Record<string, string> = {}
		if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(body.username || ''))
			fields.username = 'Use de 3 a 30 letras, números, ponto, hífen ou sublinhado.'
		if (!emailValid(body.email || '')) fields.email = 'Informe um e-mail válido.'
		if (!passwordValid(body.password || ''))
			fields.password = 'Use 8 caracteres, maiúscula, minúscula e número.'
		if (body.password !== body.confirmPassword) fields.confirmPassword = 'As senhas não conferem.'
		if (Object.keys(fields).length) validation(fields)
		if (
			db.users.some(
				(user) => user.email === body.email.trim().toLowerCase() || user.username === body.username,
			)
		)
			fail(409, 'ACCOUNT_CONFLICT', 'E-mail ou nome de usuário já cadastrado.', {
				email: 'Use outro e-mail ou entre na sua conta.',
			})
		const salt = crypto.randomUUID()
		const user = {
			id: crypto.randomUUID(),
			name: body.username,
			username: body.username,
			email: body.email.trim().toLowerCase(),
			bio: '',
			walletAlias: '',
			ens: '',
			avatar: '',
			salt,
			passwordHash: await passwordHash(body.password, salt),
			favorites: [],
			wallets: [],
		}
		// Reload after async hashing so unrelated requests are not overwritten.
		db = await database()
		if (
			db.users.some(
				(existing) => existing.email === user.email || existing.username === user.username,
			)
		)
			fail(409, 'ACCOUNT_CONFLICT', 'Conta já cadastrada.')
		db.users.push(user)
		return login(db, request, user)
	}),
	endpoint('delete', '/session', (request, _, db) => {
		const token = request.headers.get('authorization')?.replace('Bearer ', '')
		if (token) delete db.sessions[token]
		saveDatabase(db)
		return new HttpResponse(null, { status: 204 })
	}),
	endpoint('get', '/profile', (request, _, db) =>
		HttpResponse.json(publicUser(requireUser(db, request))),
	),
	endpoint('put', '/profile', async (request, _, db) => {
		const user = requireUser(db, request)
		const body = (await request.json()) as {
			name: string
			username: string
			email: string
			bio: string
			walletAlias: string
			ens: string
			avatar: string
			currentPassword?: string
			password?: string
			confirmPassword?: string
		}
		const fields: Record<string, string> = {}
		if (!body.name?.trim() || body.name.length > 80)
			fields.name = 'Informe um nome de até 80 caracteres.'
		if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(body.username || ''))
			fields.username = 'Informe um nome de usuário válido.'
		if (!emailValid(body.email || '')) fields.email = 'Informe um e-mail válido.'
		if (body.bio?.length > 500) fields.bio = 'Use até 500 caracteres.'
		if (!/^[a-z0-9-]+\.eth$/i.test(body.ens || '')) fields.ens = 'Use um nome .eth válido.'
		if (!body.walletAlias?.trim()) fields.walletAlias = 'Informe o apelido da carteira.'
		if (
			body.avatar &&
			(!/^data:image\/(png|jpeg|webp);base64,/.test(body.avatar) || body.avatar.length > 1_400_000)
		)
			fields.avatar = 'Envie PNG, JPEG ou WebP de até 1 MB.'
		if (Object.keys(fields).length) validation(fields)
		if (
			db.users.some(
				(other) =>
					other.id !== user.id &&
					(other.email === body.email.trim().toLowerCase() || other.username === body.username),
			)
		)
			fail(409, 'PROFILE_CONFLICT', 'E-mail ou usuário já utilizado.')
		if (body.password || body.currentPassword || body.confirmPassword) {
			if (user.passwordHash !== (await passwordHash(body.currentPassword || '', user.salt)))
				validation({ currentPassword: 'Senha atual incorreta.' })
			if (!passwordValid(body.password || ''))
				validation({ password: 'Use 8 caracteres, maiúscula, minúscula e número.' })
			if (body.password !== body.confirmPassword)
				validation({ confirmPassword: 'As senhas não conferem.' })
			const hash = await passwordHash(body.password!, user.salt)
			db = await database()
			requireUser(db, request).passwordHash = hash
		}
		Object.assign(requireUser(db, request), {
			name: body.name.trim(),
			username: body.username,
			email: body.email.trim().toLowerCase(),
			bio: body.bio || '',
			walletAlias: body.walletAlias || '',
			ens: body.ens || '',
			avatar: body.avatar || '',
		})
		saveDatabase(db)
		return HttpResponse.json(publicUser(requireUser(db, request)))
	}),
	endpoint('put', '/profile/password', async (request, _, db) => {
		const user = requireUser(db, request)
		const body = (await request.json()) as {
			currentPassword: string
			password: string
			confirmPassword: string
		}
		if (user.passwordHash !== (await passwordHash(body.currentPassword || '', user.salt)))
			validation({ currentPassword: 'Senha atual incorreta.' })
		if (!passwordValid(body.password || ''))
			validation({ password: 'Use 8 caracteres, maiúscula, minúscula e número.' })
		if (body.password !== body.confirmPassword)
			validation({ confirmPassword: 'As senhas não conferem.' })
		const hash = await passwordHash(body.password, user.salt)
		db = await database()
		requireUser(db, request).passwordHash = hash
		saveDatabase(db)
		return new HttpResponse(null, { status: 204 })
	}),
	endpoint('get', '/favorites', (request, _, db) =>
		HttpResponse.json(requireUser(db, request).favorites),
	),
	endpoint('put', '/favorites/:id', (request, params, db) => {
		const user = requireUser(db, request)
		if (db.scenario === 'favorite-failure')
			fail(503, 'FAVORITE_FAILED', 'Não foi possível salvar. Seu favorito foi restaurado.')
		if (!db.nfts.some((nft) => nft.id === params.id)) fail(404, 'NOT_FOUND', 'NFT não encontrado.')
		if (!user.favorites.includes(String(params.id))) user.favorites.push(String(params.id))
		saveDatabase(db)
		return HttpResponse.json(user.favorites)
	}),
	endpoint('delete', '/favorites/:id', (request, params, db) => {
		const user = requireUser(db, request)
		if (db.scenario === 'favorite-failure')
			fail(503, 'FAVORITE_FAILED', 'Não foi possível remover. Seu favorito foi restaurado.')
		user.favorites = user.favorites.filter((id) => id !== params.id)
		saveDatabase(db)
		return HttpResponse.json(user.favorites)
	}),
	endpoint('get', '/wallets', (request, _, db) =>
		HttpResponse.json(requireUser(db, request).wallets),
	),
	endpoint('put', '/wallets/:id', async (request, params, db) => {
		const user = requireUser(db, request)
		const body = (await request.json()) as Wallet
		const fields: Record<string, string> = {}
		if (!body.name?.trim()) fields.name = 'Informe o nome de exibição.'
		if (!body.alias?.trim()) fields.alias = 'Informe o apelido.'
		if (!networks.includes(body.network)) fields.network = 'Selecione uma rede.'
		if (
			!(body.network === 'solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ : /^0x[a-fA-F0-9]{40}$/).test(
				body.address || '',
			)
		)
			fields.address = 'Endereço incompatível com a rede selecionada.'
		if (!['MetaMask', 'WalletConnect', 'Coinbase', 'Phantom'].includes(body.provider))
			fields.provider = 'Selecione um tipo de carteira.'
		if (!body.profileName?.trim()) fields.profileName = 'Informe o nome do perfil.'
		if (!emailValid(body.email || '')) fields.email = 'Informe um e-mail válido.'
		if (!/^[a-z0-9-]+\.eth$/i.test(body.ens || '')) fields.ens = 'Use um nome .eth válido.'
		if (!body.referral?.trim()) fields.referral = 'Informe o código de indicação fictício.'
		if (
			body.secondaryAddress &&
			!/^(?:0x[a-fA-F0-9]{40}|[a-z0-9-]+\.eth|[1-9A-HJ-NP-Za-km-z]{32,44})$/i.test(
				body.secondaryAddress,
			)
		)
			fields.secondaryAddress = 'Informe um ENS ou endereço público válido.'
		if (Object.keys(fields).length) validation(fields)
		const current = user.wallets.find((wallet) => wallet.id === params.id)
		if (params.id !== 'new' && !current) fail(404, 'NOT_FOUND', 'Carteira não encontrada.')
		if (!current && user.wallets.length >= 2)
			fail(409, 'WALLET_LIMIT', 'São permitidas duas carteiras.')
		const wallet: Wallet = {
			secondaryAddress: body.secondaryAddress || '',
			id: current?.id || crypto.randomUUID(),
			name: body.name.trim(),
			alias: body.alias.trim(),
			network: body.network,
			address: body.address.trim(),
			provider: body.provider,
			profileName: body.profileName,
			referral: body.referral || '',
			email: body.email || '',
			ens: body.ens || '',
			primary: current?.primary ?? user.wallets.length === 0,
		}
		if (current) Object.assign(current, wallet)
		else user.wallets.push(wallet)
		saveDatabase(db)
		return HttpResponse.json(user.wallets)
	}),
	endpoint('get', '/cart', (request, _, db) => {
		if (request.headers.has('authorization')) requireUser(db, request)
		const owner = cartOwner(db, request)
		return HttpResponse.json({ ...storedCart(db, owner), items: cartItems(db, owner) })
	}),
	endpoint('post', '/cart/items', async (request, _, db) => {
		if (request.headers.has('authorization')) requireUser(db, request)
		const body = (await request.json()) as { nftId: string; edition: string; quantity: number }
		const nft = db.nfts.find((nft) => nft.id === body.nftId)
		if (!nft) fail(404, 'NOT_FOUND', 'NFT não encontrado.')
		if (!nft!.editions.includes(body.edition))
			fail(409, 'EDITION_UNAVAILABLE', 'Edição indisponível.')
		const owner = cartOwner(db, request)
		const cart = storedCart(db, owner)
		const id = `${body.nftId}:${body.edition}`
		const current = cart.items.find((item) => item.id === id)
		const quantity = body.quantity + (current?.quantity || 0)
		if (
			!Number.isSafeInteger(body.quantity) ||
			body.quantity < 1 ||
			quantity > stock(nft!, body.edition)
		)
			fail(409, 'STOCK_CONFLICT', 'Quantidade acima da disponibilidade desta edição.')
		if (current) current.quantity = quantity
		else cart.items.push({ id, ...body })
		cart.revision += 1
		saveDatabase(db)
		return HttpResponse.json({ ...cart, items: cartItems(db, owner) })
	}),
	endpoint('put', '/cart/items/:id', async (request, params, db) => {
		if (request.headers.has('authorization')) requireUser(db, request)
		const body = (await request.json()) as { quantity: number }
		const owner = cartOwner(db, request)
		const cart = storedCart(db, owner)
		const item = cart.items.find((item) => item.id === params.id)
		if (!item) fail(404, 'NOT_FOUND', 'Item não encontrado.')
		const nft = db.nfts.find((nft) => nft.id === item!.nftId)!
		if (
			!Number.isSafeInteger(body.quantity) ||
			body.quantity < 1 ||
			body.quantity > stock(nft, item!.edition)
		)
			fail(409, 'STOCK_CONFLICT', 'Quantidade acima da disponibilidade desta edição.')
		item!.quantity = body.quantity
		cart.revision += 1
		saveDatabase(db)
		return HttpResponse.json({ ...cart, items: cartItems(db, owner) })
	}),
	endpoint('delete', '/cart/items/:id', (request, params, db) => {
		if (request.headers.has('authorization')) requireUser(db, request)
		const owner = cartOwner(db, request)
		const cart = storedCart(db, owner)
		cart.items = cart.items.filter((item) => item.id !== params.id)
		cart.revision += 1
		saveDatabase(db)
		return HttpResponse.json({ ...cart, items: cartItems(db, owner) })
	}),
	endpoint('put', '/cart/coupon', async (request, _, db) => {
		if (request.headers.has('authorization')) requireUser(db, request)
		const body = (await request.json()) as { code: string }
		const code = String(body.code || '')
			.trim()
			.toUpperCase()
		if (code && (code === 'EXPIRADO' || db.scenario === 'coupon-expired'))
			fail(422, 'COUPON_EXPIRED', 'Este cupom expirou.')
		if (code && code !== 'KURIO10')
			fail(422, 'COUPON_INVALID', 'Cupom inválido. Na demonstração, use KURIO10.')
		const cart = storedCart(db, cartOwner(db, request))
		cart.coupon = code
		cart.revision += 1
		saveDatabase(db)
		return HttpResponse.json({ coupon: code })
	}),
	endpoint('post', '/quotes', async (request, _, db) => {
		if (request.headers.has('authorization')) requireUser(db, request)
		const { network = 'ethereum' } = (await request.json()) as { network: Network }
		if (!networks.includes(network)) validation({ network: 'Selecione uma rede válida.' })
		const owner = cartOwner(db, request)
		const items = cartItems(db, owner)
		if (items.some((item) => item.quantity > item.available))
			fail(
				409,
				'STOCK_CONFLICT',
				'A disponibilidade mudou. Ajuste ou remova os itens esgotados no carrinho.',
			)
		if (storedCart(db, owner).coupon && db.scenario === 'coupon-expired')
			fail(409, 'COUPON_EXPIRED', 'O cupom expirou. Remova-o no carrinho para continuar.')
		const quote = createQuote(db, owner, network)
		saveDatabase(db)
		return HttpResponse.json(quote)
	}),
	endpoint('get', '/orders', (request, _, db) => {
		const user = requireUser(db, request)
		const key = new URL(request.url).searchParams.get('key')
		const orders = Object.values(db.orders).filter(
			(order) => order.userId === user.id && (!key || order.key === key),
		)
		for (const order of orders) if (settleOrder(db, order)) publish(order)
		saveDatabase(db)
		return HttpResponse.json(orders)
	}),
	endpoint('get', '/orders/:id', (request, params, db) => {
		const user = requireUser(db, request)
		const order = db.orders[String(params.id)]
		if (!order || order.userId !== user.id) fail(404, 'NOT_FOUND', 'Pedido não encontrado.')
		if (settleOrder(db, order)) {
			saveDatabase(db)
			publish(order)
		}
		return HttpResponse.json(order)
	}),
	endpoint('post', '/orders', async (request, _, db) => {
		const user = requireUser(db, request)
		const body = (await request.json()) as {
			quoteId: string
			walletId: string
			collector: Collector
			connected: boolean
		}
		const key = request.headers.get('idempotency-key')
		if (!key || key.length > 100)
			fail(422, 'IDEMPOTENCY_REQUIRED', 'Uma chave de idempotência é obrigatória.')
		const fingerprint = JSON.stringify(
			canonical({
				quoteId: body.quoteId,
				walletId: body.walletId,
				collector: body.collector,
				connected: body.connected,
			}),
		)
		const previous = Object.values(db.orders).find(
			(order) => order.userId === user.id && order.key === key,
		)
		if (previous) {
			if (previous.fingerprint !== fingerprint)
				fail(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada com outro conteúdo.')
			return HttpResponse.json(previous)
		}
		const quote = db.quotes[body.quoteId]
		if (!quote || quote.owner !== user.id)
			fail(409, 'QUOTE_EXPIRED', 'Atualize a cotação e revise os valores novamente.')
		if (db.scenario === 'price-changed' && quote.items.length) {
			const nft = db.nfts.find((nft) => nft.id === quote.items[0].nftId)!
			nft.price = '2.19'
			nft.version += 1
			db.scenario = 'normal'
			saveDatabase(db)
			broadcastNftUpdate({
				eventId: `${nft.id}:${nft.version}`,
				resourceId: nft.id,
				version: nft.version,
				nft,
			})
		}
		if (
			quote.expiresAt < Date.now() ||
			quote.fingerprint !==
				cartFingerprint(db, user.id, quote.network, storedCart(db, user.id).coupon)
		)
			fail(
				409,
				'QUOTE_CHANGED',
				'Preço, disponibilidade ou cupom mudou. Atualize e confirme a nova cotação.',
			)
		if (db.scenario === 'coupon-expired' && quote.coupon)
			fail(409, 'COUPON_EXPIRED', 'Cupom expirado. Revise o carrinho.')
		if (!quote.items.length || quote.items.some((item) => item.quantity > item.available))
			fail(409, 'STOCK_CONFLICT', 'O carrinho está vazio ou contém edições indisponíveis.')
		if (!validCollector(body.collector))
			validation({
				collector: 'Preencha nome e e-mail válidos. A observação deve ter até 500 caracteres.',
			})
		const wallet = user.wallets.find((wallet) => wallet.id === body.walletId)
		if (!wallet || wallet.network !== quote.network || !body.connected)
			validation({ wallet: 'Conecte uma carteira cadastrada na rede selecionada.' })
		const id = crypto.randomUUID()
		const order = {
			id,
			userId: user.id,
			key: key!,
			status: 'pending' as const,
			version: 1,
			quote: structuredClone(quote),
			wallet: structuredClone(wallet!),
			collector: body.collector,
			createdAt: new Date().toISOString(),
			transaction: '',
			message: 'Pagamento pendente na simulação.',
			fingerprint,
			readyAt: Date.now() + (db.scenario === 'payment-pending' ? 60_000 : 1800),
			refuse: db.scenario === 'payment-declined',
		}
		db.orders[id] = order
		saveDatabase(db)
		publish(order)
		scheduleOrder(id, order.readyAt)
		return HttpResponse.json(order, {
			status: 201,
			headers: db.scenario === 'order-timeout' ? { 'X-Demo-Timeout': 'true' } : undefined,
		})
	}),
	endpoint('post', '/demo/expire', (request, _, db) => {
		const token =
			request.headers.get('authorization')?.replace('Bearer ', '') || localStorage.getItem(tokenKey)
		if (token && db.sessions[token]) db.sessions[token].expiresAt = 0
		saveDatabase(db)
		return HttpResponse.json({ expired: true })
	}),
	endpoint('get', '/demo/scenario', (_, __, db) => HttpResponse.json({ scenario: db.scenario })),
	endpoint('post', '/demo/scenario', async (request, _, db) => {
		const { scenario } = (await request.json()) as { scenario: string }
		if (
			![
				'normal',
				'slow',
				'out-of-order',
				'offline',
				'http-error',
				'favorite-failure',
				'coupon-expired',
				'price-changed',
				'payment-declined',
				'payment-pending',
				'order-timeout',
			].includes(scenario)
		)
			fail(422, 'UNKNOWN_SCENARIO', 'Cenário desconhecido.')
		db.scenario = scenario
		saveDatabase(db)
		return HttpResponse.json({ scenario })
	}),
]
