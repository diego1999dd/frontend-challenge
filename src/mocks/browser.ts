import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { registerApiRecovery } from '@/lib/http'

export const worker = setupWorker(...handlers)

registerApiRecovery(() => {
	// A suspended Service Worker can restart without its in-memory active clients.
	// Use the activation handshake of our versioned mockServiceWorker.js, without
	// stopping MSW: stop/start would replace the WebSocket constructor used by Socket.IO.
	return new Promise<void>((resolve, reject) => {
		const controller = navigator.serviceWorker.controller
		if (!controller) {
			reject(new Error('O Service Worker não está controlando esta página.'))
			return
		}
		const cleanup = () => {
			window.clearTimeout(timer)
			navigator.serviceWorker.removeEventListener('message', onMessage)
		}
		const onMessage = (event: MessageEvent) => {
			if (event.source !== controller || event.data?.type !== 'MOCKING_ENABLED') return
			cleanup()
			resolve()
		}
		const timer = window.setTimeout(() => {
			cleanup()
			reject(new Error('Não foi possível reativar a API simulada.'))
		}, 3000)
		navigator.serviceWorker.addEventListener('message', onMessage)
		try {
			controller.postMessage('MOCK_ACTIVATE')
		} catch (error) {
			cleanup()
			reject(error)
		}
	})
})

let realtime: Promise<void> | undefined
export function enableRealtimeMock() {
	return (realtime ??= import('./realtime-transport')
		.then(({ realtimeHandler }) => {
			worker.use(realtimeHandler)
		})
		.catch((error: unknown) => {
			realtime = undefined
			throw error
		}))
}
