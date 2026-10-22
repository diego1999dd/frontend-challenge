import type { Nft } from '@/features/catalog/contracts'
import type { Order } from '@/features/account/contracts'

export interface OrderUpdatedEvent {
	eventId: string
	resourceId: string
	userId: string
	version: number
	order: Order
}

export interface NftUpdatedEvent {
	eventId: string
	resourceId: string
	version: number
	nft: Nft
}

export interface ServerEvents {
	'nft.updated': (event: NftUpdatedEvent) => void
	'order.updated': (event: OrderUpdatedEvent) => void
}
