import type { Nft } from '@/features/catalog/contracts'

export type Network = 'ethereum' | 'polygon' | 'solana'
export interface Profile {
	id: string
	name: string
	username: string
	email: string
	bio: string
	walletAlias: string
	ens: string
	avatar: string
}
export interface Session {
	user: Profile | null
	expiresAt?: number
}
export interface Wallet {
	secondaryAddress?: string
	id: string
	name: string
	alias: string
	network: Network
	address: string
	provider: string
	profileName: string
	referral: string
	email: string
	ens: string
	primary: boolean
}
export interface CartItem {
	id: string
	nftId: string
	edition: string
	quantity: number
	nft: Nft
	available: number
	total: string
}
export interface Cart {
	items: CartItem[]
	revision: number
	coupon: string
}
export interface Quote {
	id: string
	items: CartItem[]
	subtotal: string
	discount: string
	fee: string
	total: string
	coupon: string
	network: Network
	expiresAt: number
}
export interface Collector {
	name: string
	email: string
	note: string
}
export interface Order {
	id: string
	userId: string
	key: string
	status: 'pending' | 'confirmed' | 'declined'
	version: number
	quote: Quote
	wallet: Wallet
	collector: Collector
	createdAt: string
	transaction: string
	message: string
}
