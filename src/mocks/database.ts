import type {
	CartItem,
	Collector,
	Network,
	Order,
	Profile,
	Quote,
	Wallet,
} from '@/features/account/contracts'
import type { Nft } from '@/features/catalog/contracts'
import { ethToWei } from '@/lib/eth'
import { initialNfts } from './fixtures'

export const databaseKey = 'kurio-demo-db-v2'
export const tokenKey = 'kurio-demo-session'
export const visitorKey = 'kurio-demo-visitor'
interface User extends Profile {
	passwordHash: string
	salt: string
	favorites: string[]
	wallets: Wallet[]
}
export interface StoredCart {
	items: { id: string; nftId: string; edition: string; quantity: number }[]
	revision: number
	coupon: string
}
interface StoredQuote extends Quote {
	owner: string
	fingerprint: string
}
interface StoredOrder extends Order {
	fingerprint: string
	readyAt: number
	refuse: boolean
}
export interface Database {
	users: User[]
	sessions: Record<string, { userId: string; expiresAt: number }>
	carts: Record<string, StoredCart>
	nfts: Nft[]
	quotes: Record<string, StoredQuote>
	orders: Record<string, StoredOrder>
	scenario: string
}
let initialization: Promise<void> | undefined

export async function passwordHash(password: string, salt: string) {
	const material = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits'],
	)
	const hash = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100_000 },
		material,
		256,
	)
	return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
async function seed() {
	const users = await Promise.all(
		['ana', 'bruno'].map(async (name, index): Promise<User> => {
			const salt = `kurio-fictional-${name}-v2`
			return {
				id: `user-${index + 1}`,
				name: index === 0 ? 'Ana Colecionadora' : 'Bruno Colecionador',
				username: name,
				email: `${name}@kurio.test`,
				bio: '',
				walletAlias: 'Principal',
				ens: `${name}.eth`,
				avatar: '',
				salt,
				passwordHash: await passwordHash('Demo123!', salt),
				favorites: [],
				wallets: [
					{
						id: `wallet-${index + 1}`,
						name: 'Minha carteira',
						alias: 'Principal',
						network: 'ethereum',
						address: `0x${String(index + 1).repeat(40)}`,
						provider: 'MetaMask',
						profileName: name,
						referral: 'DEMO',
						email: `${name}@kurio.test`,
						ens: `${name}.eth`,
						primary: true,
					},
				],
			}
		}),
	)
	if (!localStorage.getItem(databaseKey))
		saveDatabase({
			users,
			sessions: {},
			carts: {},
			nfts: structuredClone(initialNfts),
			quotes: {},
			orders: {},
			scenario: 'normal',
		})
}
export async function database(): Promise<Database> {
	if (!localStorage.getItem(databaseKey)) {
		initialization ??= seed().finally(() => {
			initialization = undefined
		})
		await initialization
	}
	const db = JSON.parse(localStorage.getItem(databaseKey)!) as Database
	let migrated = false
	for (const nft of db.nfts) {
		if (nft.image.startsWith('/images/nfts/') && nft.image.endsWith('.png')) {
			nft.image = nft.image.replace(/\.png$/, '.avif')
			migrated = true
		}
		if (!nft.gallery?.length) {
			const gallery = initialNfts.find((initial) => initial.id === nft.id)?.gallery
			if (gallery) {
				nft.gallery = gallery.map((view) => ({ ...view, image: nft.image }))
				migrated = true
			}
		}
	}
	if (migrated) saveDatabase(db)
	return db
}
export function saveDatabase(db: Database) {
	localStorage.setItem(databaseKey, JSON.stringify(db))
}
export function publicUser(user: User): Profile {
	return {
		id: user.id,
		name: user.name,
		username: user.username,
		email: user.email,
		bio: user.bio,
		walletAlias: user.walletAlias || '',
		ens: user.ens,
		avatar: user.avatar,
	}
}
export function sessionUser(db: Database, request: Request) {
	const token = request.headers.get('authorization')?.replace(/^Bearer /, '')
	const session = token ? db.sessions[token] : undefined
	return session && session.expiresAt > Date.now()
		? db.users.find((user) => user.id === session.userId)
		: undefined
}
export function cartOwner(db: Database, request: Request) {
	return (
		sessionUser(db, request)?.id ?? `guest:${request.headers.get('x-visitor-id') || 'anonymous'}`
	)
}
export function storedCart(db: Database, owner: string) {
	return (db.carts[owner] ??= { items: [], revision: 1, coupon: '' })
}
export function stock(nft: Nft, edition: string) {
	if (nft.unavailableEditions?.includes(edition)) return 0
	return edition === '1/1' ? Math.min(1, nft.available) : nft.available
}
export function cartItems(db: Database, owner: string): CartItem[] {
	return storedCart(db, owner).items.flatMap((item) => {
		const nft = db.nfts.find((nft) => nft.id === item.nftId)
		return nft
			? [
					{
						...item,
						nft: structuredClone(nft),
						available: stock(nft, item.edition),
						total: decimal(ethToWei(nft.price) * BigInt(item.quantity)),
					},
				]
			: []
	})
}
export function cartFingerprint(db: Database, owner: string, network: Network, coupon: string) {
	return JSON.stringify({
		items: cartItems(db, owner).map((item) => [
			item.id,
			item.quantity,
			item.nft.version,
			item.nft.price,
			item.available,
		]),
		network,
		coupon,
	})
}
export function decimal(wei: bigint) {
	const whole = wei / 10n ** 18n
	const fraction = (wei % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '')
	return `${whole}${fraction ? `.${fraction}` : ''}`
}
export function createQuote(db: Database, owner: string, network: Network): StoredQuote {
	const items = cartItems(db, owner)
	const coupon = storedCart(db, owner).coupon
	const subtotal = items.reduce(
		(total, item) => total + ethToWei(item.nft.price) * BigInt(item.quantity),
		0n,
	)
	const discount = coupon === 'KURIO10' ? subtotal / 10n : 0n
	const fee = items.length
		? ethToWei(network === 'ethereum' ? '0.016' : network === 'polygon' ? '0.002' : '0.0005')
		: 0n
	const quote: StoredQuote = {
		id: crypto.randomUUID(),
		owner,
		items,
		coupon,
		network,
		subtotal: decimal(subtotal),
		discount: decimal(discount),
		fee: decimal(fee),
		total: decimal(subtotal - discount + fee),
		expiresAt: Date.now() + 120_000,
		fingerprint: cartFingerprint(db, owner, network, coupon),
	}
	db.quotes[quote.id] = quote
	const recent = Object.entries(db.quotes)
		.filter(([, item]) => item.expiresAt > Date.now())
		.slice(-40)
	db.quotes = Object.fromEntries(recent)
	return quote
}
export function settleOrder(db: Database, order: StoredOrder): boolean {
	if (order.status !== 'pending' || Date.now() < order.readyAt) return false
	const insufficient = order.quote.items.some((item) => {
		const nft = db.nfts.find((nft) => nft.id === item.nftId)
		return !nft || stock(nft, item.edition) < item.quantity
	})
	order.status = order.refuse || insufficient ? 'declined' : 'confirmed'
	order.version += 1
	order.message =
		order.status === 'confirmed'
			? 'Pagamento confirmado na simulação.'
			: 'Pagamento recusado. Os itens foram preservados no carrinho.'
	if (order.status === 'confirmed') {
		const cart = storedCart(db, order.userId)
		for (const purchased of order.quote.items) {
			const nft = db.nfts.find((nft) => nft.id === purchased.nftId)!
			nft.available -= purchased.quantity
			nft.version += 1
			const current = cart.items.find((item) => item.id === purchased.id)
			if (current) current.quantity = Math.max(0, current.quantity - purchased.quantity)
		}
		cart.items = cart.items.filter((item) => item.quantity > 0)
		cart.revision += 1
		cart.coupon = ''
		order.transaction = `0x${order.id.replaceAll('-', '').padEnd(64, '0')}`
	}
	return true
}
export function validCollector(value: Collector) {
	return (
		value &&
		value.name?.trim().length >= 2 &&
		/^\S+@\S+\.\S+$/.test(value.email) &&
		(!value.note || value.note.length <= 500)
	)
}
