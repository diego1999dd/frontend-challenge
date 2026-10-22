import { expect, test, type Page } from '@playwright/test'

async function api(
	page: Page,
	method: string,
	path: string,
	data?: unknown,
	extraHeaders?: Record<string, string>,
) {
	return page.evaluate(
		async ({ method, path, data, extraHeaders }) => {
			const response = await fetch(`/api${path}`, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('kurio-demo-session') || ''}`,
					'X-Visitor-Id': localStorage.getItem('kurio-demo-visitor') || '',
					...extraHeaders,
				},
				body: data === undefined ? undefined : JSON.stringify(data),
			})
			return { status: response.status, data: await response.json().catch(() => null) }
		},
		{ method, path, data, extraHeaders },
	)
}
async function login(page: Page, user = 'ana', redirect = '/perfil') {
	await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
	await page.getByLabel('E-mail', { exact: true }).fill(`${user}@kurio.test`)
	await page.getByLabel('Senha', { exact: true }).fill('Demo123!')
	await page.locator('.auth-form').getByRole('button', { name: 'Entrar', exact: true }).click()
	await expect(page).toHaveURL(new RegExp(`${redirect}$`))
}
async function addNft(page: Page, id = 'nft-2') {
	await page.goto(`/nfts/${id}`)
	await page
		.getByRole('button', {
			name: page.viewportSize()!.width < 768 ? 'Comprar NFT' : 'COMPRAR',
			exact: true,
		})
		.click()
	await expect(page).toHaveURL(/\/carrinho/)
	await expect(page.locator('.cart-item')).toHaveCount(1)
}
async function checkout(page: Page) {
	await page.goto('/pagamento')
	const mobile = page.viewportSize()!.width < 768
	await page
		.getByRole('button', {
			name: mobile ? 'Conectar com MetaMask' : 'Conectar carteira',
			exact: true,
		})
		.click()
	await page.getByRole('button', { name: 'Autorizar conexão', exact: true }).click()
	await page.getByRole('button', { name: 'Revisar compra', exact: true }).click()
	await expect(page.getByRole('dialog', { name: 'Revisar e confirmar compra' })).toBeVisible()
}

test('bootstrap preserva filtros da URL e rotas lazy não geram erros do React', async ({
	page,
}) => {
	const errors: string[] = []
	const catalogRequests: URL[] = []
	page.on('request', (request) => {
		const url = new URL(request.url())
		if (url.pathname === '/api/nfts') catalogRequests.push(url)
	})
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('console', (message) => {
		if (message.type() === 'error' && /called use\(\)|conditional-use-of-use/.test(message.text()))
			errors.push(message.text())
	})
	await page.goto('/?min=%221%22&max=%222%22')
	await expect(page.getByRole('article').first()).toBeVisible()
	expect(catalogRequests.length).toBeGreaterThan(0)
	expect(
		catalogRequests.every(
			(url) => url.searchParams.get('min') === '1' && url.searchParams.get('max') === '2',
		),
	).toBe(true)
	await login(page)
	for (const [path, heading] of [
		['/carteiras', 'Carteira principal'],
		['/favoritos', 'Lista de interesse'],
		['/pedidos', 'Meus pedidos'],
		['/demo', 'Cenários da demonstração'],
	]) {
		await page.goto(path)
		await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
	}
	expect(errors).toEqual([])
})

test('sessão, favorito otimista, rollback e isolamento entre usuários', async ({ page }) => {
	await login(page)
	await page.goto('/nfts/nft-2')
	const favorite =
		page.viewportSize()!.width < 768
			? page.getByRole('button', { name: 'Favoritar NFT', exact: true })
			: page.getByRole('button', { name: 'Favoritar', exact: true })
	await favorite.click()
	await expect(favorite).toHaveAttribute('aria-pressed', 'true')
	await expect(favorite).toBeEnabled()
	await page.reload()
	await expect(favorite).toHaveAttribute('aria-pressed', 'true')
	await api(page, 'POST', '/demo/scenario', { scenario: 'favorite-failure' })
	await favorite.click()
	await expect(page.getByRole('alert')).toContainText('restaurado')
	await expect(favorite).toHaveAttribute('aria-pressed', 'true')
	await api(page, 'POST', '/demo/scenario', { scenario: 'normal' })
	await page.goto('/perfil')
	await page.getByRole('button', { name: 'Sair', exact: true }).click()
	await login(page, 'bruno', '/favoritos')
	await expect(page.getByText('Nenhum favorito ainda')).toBeVisible()
	await expect(page.locator('.account-content')).not.toContainText('Sage Nomad')
})

test('carrinho visitante, login, quantidade, cupom e compra com recibo persistente', async ({
	page,
}) => {
	await addNft(page)
	await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
	await expect(page.locator('.cart-item-total')).toContainText('3.38 ETH')
	await page.getByLabel('Código promocional').fill('INVALIDO')
	await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
	await expect(page.getByRole('alert')).toContainText('Cupom inválido')
	await page.getByLabel('Código promocional').fill('KURIO10')
	await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
	await expect(page.getByRole('button', { name: 'Remover cupom KURIO10' })).toBeVisible()
	await page.reload()
	await expect(page.locator('.cart-item-total')).toContainText('3.38 ETH')
	await login(page, 'ana', '/carrinho')
	await expect(page.locator('.cart-item-total')).toContainText('3.38 ETH')
	await checkout(page)
	await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
	await expect(page).toHaveURL(/\/pedidos\/.+/)
	await expect(
		page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
	).toBeVisible()
	const receipt = await page.locator('.order-receipt').innerText()
	await page.reload()
	await expect(page.locator('.order-receipt')).toHaveText(receipt, { useInnerText: true })
	await page.goto('/carrinho')
	await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})

test('pagamento recusado preserva os itens e expiração retoma o checkout', async ({ page }) => {
	await login(page)
	await addNft(page)
	await page.goto('/pagamento')
	const mobile = page.viewportSize()!.width < 768
	if (mobile) await page.getByRole('button', { name: 'Dados do colecionador', exact: true }).click()
	await page
		.getByLabel('Observação do colecionador (opcional)', { exact: true })
		.fill('Meu recibo de teste')
	await api(page, 'POST', '/demo/expire')
	await page.reload()
	await expect(page).toHaveURL(/\/login\?redirect=/)
	await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
	await page.getByLabel('Senha', { exact: true }).fill('Demo123!')
	await page.locator('.auth-form').getByRole('button', { name: 'Entrar', exact: true }).click()
	await expect(page).toHaveURL(/\/pagamento$/)
	if (mobile) await page.getByRole('button', { name: 'Dados do colecionador', exact: true }).click()
	await expect(
		page.getByLabel('Observação do colecionador (opcional)', { exact: true }),
	).toHaveValue('Meu recibo de teste')
	if (mobile) await page.getByRole('button', { name: 'Voltar ao pagamento', exact: true }).click()
	await api(page, 'POST', '/demo/scenario', { scenario: 'payment-declined' })
	await checkout(page)
	await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
	await expect(page.getByRole('heading', { name: 'Pagamento recusado', exact: true })).toBeVisible()
	await page.goto('/carrinho')
	await expect(page.locator('.cart-item')).toHaveCount(1)
})

test('Socket.IO atualiza carrinho, ignora eventos antigos e recupera após reconectar', async ({
	page,
}) => {
	await login(page)
	await addNft(page)
	await expect(page.getByText('Tempo real conectado', { exact: false })).toBeVisible()
	await api(page, 'POST', '/demo/nfts/nft-2/update', {
		price: '2.50',
		available: 2,
		duplicate: true,
	})
	await expect(page.locator('.cart-item-total')).toContainText('2.5 ETH')
	await api(page, 'POST', '/demo/socket/disconnect')
	await expect(page.getByText('Tempo real conectado', { exact: false })).toBeVisible()
	await expect(page.locator('.quote-total')).toContainText('2.516 ETH')
})

test('cadastro, validação, perfil, avatar, senha e carteiras persistem', async ({ page }) => {
	test.setTimeout(60_000)
	await page.goto('/cadastro?redirect=%2Fperfil')
	await page.getByLabel('Nome de usuário', { exact: true }).fill('ana')
	await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
	await page.getByLabel('Senha', { exact: true }).fill('Demo123!')
	await page.getByLabel('Confirmar senha', { exact: true }).fill('Demo123!')
	await page.locator('.auth-form').getByRole('button', { name: 'Criar conta', exact: true }).click()
	await expect(page.getByRole('alert').first()).toContainText(/já cadastrado|outro e-mail/)
	await page.getByLabel('Nome de usuário', { exact: true }).fill('colecionador')
	await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.test')
	await page.locator('.auth-form').getByRole('button', { name: 'Criar conta', exact: true }).click()
	await expect(page).toHaveURL(/\/perfil$/)
	await page.getByLabel('Nome de exibição', { exact: true }).fill('Colecionador Teste')
	await page.getByLabel('Nome ENS', { exact: true }).fill('teste.eth')
	await page.getByLabel('Apelido da carteira', { exact: true }).fill('Minha carteira')
	await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!')
	await page.getByLabel('Confirmar nova senha', { exact: true }).fill('outra')
	await page.getByRole('button', { name: 'Salvar', exact: true }).click()
	await expect(page.getByRole('alert').first()).toBeVisible()
	await page.getByLabel('Senha atual', { exact: true }).fill('Demo123!')
	await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha123!')
	await page.getByLabel('Alterar avatar', { exact: true }).setInputFiles({
		name: 'avatar.png',
		mimeType: 'image/png',
		buffer: Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=',
			'base64',
		),
	})
	await page.getByRole('button', { name: 'Salvar', exact: true }).click()
	await expect(page.getByText('Perfil salvo com sucesso.')).toBeVisible()
	await page.reload()
	await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue(
		'Colecionador Teste',
	)
	await expect(page.getByRole('img', { name: 'Avatar do colecionador' })).toBeVisible()
	await page.goto('/carteiras')
	await page.getByLabel('Nome de exibição', { exact: true }).fill('Carteira teste')
	await page.getByLabel('Apelido da carteira', { exact: true }).fill('Principal')
	await page.getByLabel('Rede', { exact: true }).selectOption('ethereum')
	await page.getByLabel('Nome do perfil', { exact: true }).fill('colecionador')
	await page.getByLabel('Tipo de carteira', { exact: true }).selectOption('MetaMask')
	await page.getByLabel('Nome ENS', { exact: true }).fill('colecionador')
	await page.getByLabel('Código de indicação', { exact: true }).fill('DEMO')
	await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.test')
	await page.getByLabel('Endereço da carteira', { exact: true }).fill('inválido')
	await page.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
	await expect(page.getByText('Endereço incompatível com a rede selecionada.')).toBeVisible()
	await page.getByLabel('Endereço da carteira', { exact: true }).fill(`0x${'a'.repeat(40)}`)
	await page.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
	await expect(page.getByText('Carteira salva com sucesso.')).toBeVisible()
	await page.reload()
	await expect(page.getByLabel('Endereço da carteira', { exact: true })).toHaveValue(
		`0x${'a'.repeat(40)}`,
	)
	await page.getByRole('button', { name: 'Sair', exact: true }).click()
	await page.goto('/login?redirect=%2Fperfil')
	await page.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.test')
	await page.getByLabel('Senha', { exact: true }).fill('NovaSenha123!')
	await page.locator('.auth-form').getByRole('button', { name: 'Entrar', exact: true }).click()
	await expect(page).toHaveURL(/\/perfil$/)
})

test('timeout recupera o mesmo pedido, idempotência e eventos antigos não duplicam a compra', async ({
	page,
}) => {
	test.setTimeout(60_000)
	await login(page)
	await addNft(page)
	await checkout(page)
	await api(page, 'POST', '/demo/scenario', { scenario: 'order-timeout' })
	await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click({ clickCount: 2 })
	await expect(page).toHaveURL(/\/pedidos\/.+/, { timeout: 20_000 })
	await expect(
		page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
	).toBeVisible()
	const { data: orders } = await api(page, 'GET', '/orders')
	expect(orders).toHaveLength(1)
	const order = orders[0]
	const same = await api(
		page,
		'POST',
		'/orders',
		{
			connected: true,
			collector: order.collector,
			walletId: order.wallet.id,
			quoteId: order.quote.id,
		},
		{ 'Idempotency-Key': order.key },
	)
	expect(same.data.id).toBe(order.id)
	const conflict = await api(
		page,
		'POST',
		'/orders',
		{ quoteId: 'different' },
		{ 'Idempotency-Key': order.key },
	)
	expect(conflict.status).toBe(409)
	await api(page, 'POST', `/demo/orders/${order.id}/replay`)
	await api(page, 'POST', '/demo/socket/disconnect')
	await page.reload()
	await expect(
		page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
	).toBeVisible()
	const again = await api(page, 'GET', '/orders')
	expect(again.data).toHaveLength(1)
	const quote = await api(page, 'POST', '/quotes', { network: 'ethereum' })
	expect(quote.data.items).toHaveLength(0)
})

test('pedido pendente recupera a mesma compra após desconexão e refresh', async ({ page }) => {
	await login(page)
	await addNft(page)
	await checkout(page)
	await page.clock.install()
	await api(page, 'POST', '/demo/scenario', { scenario: 'payment-pending' })
	await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
	await expect(page.getByRole('heading', { name: 'Pedido pendente', exact: true })).toBeVisible()
	const receiptURL = page.url()
	const before = await api(page, 'GET', '/orders')
	expect(before.data).toHaveLength(1)
	expect(before.data[0].status).toBe('pending')
	await api(page, 'POST', '/demo/socket/disconnect')
	await page.reload()
	await expect(page.getByRole('heading', { name: 'Pedido pendente', exact: true })).toBeVisible()
	await page.clock.fastForward(61_000)
	await expect(
		page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
	).toBeVisible()
	await expect(page).toHaveURL(receiptURL)
	const after = await api(page, 'GET', '/orders')
	expect(after.data).toHaveLength(1)
	expect(after.data[0].id).toBe(before.data[0].id)
	expect(after.data[0].status).toBe('confirmed')
	await api(page, 'POST', `/demo/orders/${after.data[0].id}/replay`)
	await page.reload()
	await expect(
		page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
	).toBeVisible()
	expect((await api(page, 'GET', '/orders')).data).toHaveLength(1)
})

test('preço muda na confirmação e exige revisar a nova cotação', async ({ page }) => {
	await login(page)
	await addNft(page)
	await checkout(page)
	await api(page, 'POST', '/demo/scenario', { scenario: 'price-changed' })
	await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
	await expect(page.getByRole('alert')).toContainText('mudou')
	await expect(page.getByRole('dialog', { name: 'Revisar e confirmar compra' })).not.toBeVisible()
	await expect(page.locator('.quote-total')).toContainText('2.206 ETH')
	await expect(page.getByRole('button', { name: 'Revisar compra', exact: true })).toBeEnabled()
	await page.getByRole('button', { name: 'Revisar compra', exact: true }).click()
	await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
	await expect(
		page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
	).toBeVisible()
	await expect(page.locator('.order-receipt .quote-total')).toContainText('2.206 ETH')
})

test('carregamento lento, falha HTTP e recuperação usam os handlers MSW', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('article')).toHaveCount(9)
	await api(page, 'POST', '/demo/scenario', { scenario: 'slow' })
	await page.goto('/nfts/nft-2')
	await expect(page.getByRole('status', { name: 'Carregando NFT', exact: true })).toBeVisible()
	await expect(page.getByRole('heading', { name: 'Sage Nomad #009', exact: true })).toBeVisible()
	await api(page, 'POST', '/demo/scenario', { scenario: 'http-error' })
	await page.goto('/')
	await expect(
		page.getByRole('heading', { name: 'Não foi possível carregar o catálogo' }),
	).toBeVisible()
	await api(page, 'POST', '/demo/scenario', { scenario: 'normal' })
	await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
	await expect(page.getByRole('article')).toHaveCount(9)
})

test('edição indisponível, limite de quantidade, cupom expirado e remoção do carrinho', async ({
	page,
}) => {
	await page.goto('/nfts/nft-2')
	await expect(page.getByRole('button', { name: '1/1', exact: true })).toBeDisabled()
	await addNft(page)
	await page.getByRole('button', { name: 'Aumentar quantidade', exact: true }).click()
	await expect(page.locator('.cart-item-total')).toContainText('3.38 ETH')
	await expect(
		page.getByRole('button', { name: 'Aumentar quantidade', exact: true }),
	).toBeDisabled()
	await page.getByLabel('Código promocional').fill('EXPIRADO')
	await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
	await expect(page.getByRole('alert')).toContainText('expirou')
	await page.getByRole('button', { name: 'Remover Sage Nomad #009', exact: true }).click()
	await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})
