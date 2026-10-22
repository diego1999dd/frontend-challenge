import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from '@/lib/query-client'
import { preloadInitialCatalog } from '@/features/catalog/preload'
import { router } from './router'
import { SessionProvider } from './features/account/session-provider'
import './styles/global.css'
import { recoverStaleChunk } from '@/lib/chunk-recovery'

recoverStaleChunk()

async function bootstrap() {
	if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
		const { worker } = await import('./mocks/browser')
		await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
	}
	preloadInitialCatalog(queryClient, {
		pathname: router.state.location.pathname,
		search: { ...router.state.location.search },
	})
	// Route definitions are static so Vite can preload their shared dependencies
	// from the HTML. Secondary page components remain lazy. The socket itself is
	// imported only by the mounted effect, after the network worker is ready.
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
