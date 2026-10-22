import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/realtime/contracts'
import { database } from './database'
import { registerRealtimeTransport } from './realtime'

// MSW 2.10 normalizes Socket.IO's /socket.io/ pathname to / when matching.
const channel = ws.link(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/`)
const clients = new Map<
	ReturnType<typeof toSocketIo>['client'],
	{ token: string; close: () => void }
>()

export const realtimeHandler = channel.addEventListener('connection', (connection) => {
	if (!connection.client.url.pathname.startsWith('/socket.io/')) {
		connection.server.connect()
		return
	}
	const socket = toSocketIo(connection)
	clients.set(socket.client, {
		token: connection.client.url.searchParams.get('session') || '',
		close: () => connection.client.close(),
	})
	const heartbeat = setInterval(() => connection.client.send('2'), 25000)
	connection.client.addEventListener('close', () => {
		clearInterval(heartbeat)
		clients.delete(socket.client)
	})
})

function broadcastNftUpdate(event: NftUpdatedEvent) {
	clients.forEach((_, client) => client.emit('nft.updated', event))
}

function broadcastOrderUpdate(event: OrderUpdatedEvent) {
	void database().then((db) =>
		clients.forEach(({ token }, client) => {
			const session = db.sessions[token]
			if (session && session.userId === event.userId && session.expiresAt > Date.now())
				client.emit('order.updated', event)
		}),
	)
}

function disconnectClients() {
	clients.forEach(({ close }) => close())
}

registerRealtimeTransport({ broadcastNftUpdate, broadcastOrderUpdate, disconnectClients })
