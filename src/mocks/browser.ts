import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

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
