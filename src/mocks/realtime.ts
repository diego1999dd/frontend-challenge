import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/realtime/contracts'

interface RealtimeTransport {
	broadcastNftUpdate(event: NftUpdatedEvent): void
	broadcastOrderUpdate(event: OrderUpdatedEvent): void
	disconnectClients(): void
}

let transport: RealtimeTransport | undefined

export function registerRealtimeTransport(value: RealtimeTransport) {
	transport = value
}

// REST mutations persist their result before publishing. Before a socket exists
// there is no recipient; its initial REST reconciliation recovers that state.
export function broadcastNftUpdate(event: NftUpdatedEvent) {
	transport?.broadcastNftUpdate(event)
}

export function broadcastOrderUpdate(event: OrderUpdatedEvent) {
	transport?.broadcastOrderUpdate(event)
}

export function disconnectClients() {
	transport?.disconnectClients()
}
