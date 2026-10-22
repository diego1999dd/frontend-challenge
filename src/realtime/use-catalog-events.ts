import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { catalogKeys } from '@/features/catalog/queries'
import type { NftUpdatedEvent, OrderUpdatedEvent, ServerEvents } from './contracts'
import { useSession } from '@/features/account/session-context'
import { cartKey } from '@/features/account/queries'
import { afterArtworkPaint } from './after-artwork-paint'

export function useCatalogEvents() {
	const { user, loading } = useSession()
	const userId = user?.id
	const queryClient = useQueryClient()
	const [connected, setConnected] = useState(false)
	const [notice, setNotice] = useState('')
	useEffect(() => {
		if (!notice) return
		const timer = window.setTimeout(() => setNotice(''), 6000)
		return () => window.clearTimeout(timer)
	}, [notice])

	useEffect(() => {
		if (loading) return
		let disposed = false
		let activeSocket: Socket<ServerEvents> | undefined
		let stopWaiting: (() => void) | undefined
		let stopArtworkWait: (() => void) | undefined
		const connect = () => {
			// Give the first REST-backed view priority over loading the event client.
			// This is a one-time bootstrap gate, not a dependency on later refetches.
			if (disposed || queryClient.isFetching({ queryKey: catalogKeys.all })) return
			stopWaiting?.()
			stopWaiting = undefined
			stopArtworkWait = afterArtworkPaint(() => {
				const network =
					import.meta.env.VITE_ENABLE_MOCKS !== 'false'
						? import('@/mocks/browser').then(({ enableRealtimeMock }) => enableRealtimeMock())
						: Promise.resolve()
				void network
					.then(() => import('socket.io-client'))
					.then(({ io }) => {
						if (disposed) return
						const versions = new Map<string, number>()
						const socket: Socket<ServerEvents> = io(window.location.origin, {
							transports: ['websocket'],
							query: { session: localStorage.getItem('kurio-demo-session') || '' },
							reconnectionDelay: 500,
							randomizationFactor: 0,
						})
						activeSocket = socket
						const reconcile = () => {
							setConnected(true)
							void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
							void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
							void queryClient.invalidateQueries({ queryKey: ['quote'] })
							if (userId)
								void queryClient.invalidateQueries({ queryKey: ['private', userId, 'orders'] })
						}
						const update = (event: NftUpdatedEvent) => {
							if (event.version <= (versions.get(event.resourceId) ?? 1)) return
							versions.set(event.resourceId, event.version)
							// REST remains authoritative for list membership, sorting and prices.
							void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
							void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
							void queryClient.invalidateQueries({ queryKey: ['quote'] })
							setNotice(`Preço ou disponibilidade de ${event.nft.name} atualizado.`)
						}
						const orderUpdate = (event: OrderUpdatedEvent) => {
							if (!userId || event.userId !== userId) return
							const id = `order:${event.resourceId}`
							if (event.version <= (versions.get(id) ?? 0)) return
							versions.set(id, event.version)
							void queryClient.invalidateQueries({ queryKey: ['private', userId, 'orders'] })
							void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
							void queryClient.invalidateQueries({ queryKey: ['quote'] })
						}
						socket.on('connect', reconcile)
						socket.on('disconnect', () => setConnected(false))
						socket.on('nft.updated', update)
						socket.on('order.updated', orderUpdate)
					})
					.catch(() => {
						if (!disposed) setConnected(false)
					})
			})
		}
		if (queryClient.isFetching({ queryKey: catalogKeys.all }))
			stopWaiting = queryClient.getQueryCache().subscribe(connect)
		connect()
		return () => {
			disposed = true
			stopWaiting?.()
			stopArtworkWait?.()
			activeSocket?.removeAllListeners()
			activeSocket?.disconnect()
		}
	}, [queryClient, userId, loading])

	return { connected, notice }
}
