import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from '@/lib/query-client'
import './styles/global.css'

async function bootstrap() {
	const app = Promise.all([import('./router'), import('./features/account/session-provider')])
	if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
		const { worker } = await import('./mocks/browser')
		await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
	}
	// Download application modules in parallel; the socket itself is imported only
	// by the mounted effect, after the network worker is ready.
	const [{ router }, { SessionProvider }] = await app
	createRoot(document.getElementById('root')!).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<SessionProvider>
					<RouterProvider router={router} />
				</SessionProvider>
			</QueryClientProvider>
		</StrictMode>,
	)
}

void bootstrap().catch(() => {
	const root = document.getElementById('root')!
	root.textContent =
		'Não foi possível iniciar a aplicação. Recarregue a página para tentar novamente.'
	root.setAttribute('role', 'alert')
})
