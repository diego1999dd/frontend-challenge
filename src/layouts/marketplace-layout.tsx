import { Outlet, useRouterState } from '@tanstack/react-router'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileNavigation } from '@/components/mobile-navigation'
import { NoticeProvider } from '@/components/notice-provider'
import { useCatalogEvents } from '@/realtime/use-catalog-events'

export function MarketplaceLayout() {
	const { connected, notice } = useCatalogEvents()
	const pathname = useRouterState({ select: (state) => state.location.pathname })
	const isHome = pathname === '/'
	const isAuth = ['/login', '/cadastro'].includes(pathname)
	const hasMobileNavigation =
		isHome || ['/perfil', '/carteiras', '/favoritos', '/pedidos'].includes(pathname)
	const isAccount = ['/perfil', '/carteiras', '/favoritos', '/pedidos'].includes(pathname)
	const isCommerce =
		pathname === '/carrinho' || pathname === '/pagamento' || pathname.startsWith('/pedidos/')
	return (
		<NoticeProvider>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:p-3 focus:text-background"
			>
				Pular para o conteúdo
			</a>
			<div
				className={`market-shell ${isHome || isAuth ? 'market-shell--home' : ''} ${isAuth ? 'market-shell--auth' : ''} ${isAccount ? 'market-shell--account' : ''} ${isCommerce ? 'market-shell--commerce' : ''}`}
			>
				<Header />
				<main id="main-content" tabIndex={-1}>
					<Outlet />
				</main>
				{!isAccount && <Footer />}
				<div role="status" aria-live="polite" className={notice ? 'realtime-notice' : 'sr-only'}>
					{notice}
				</div>
				<span className="sr-only">
					{connected ? 'Tempo real conectado' : 'Tempo real desconectado'}
				</span>
			</div>
			{hasMobileNavigation && <MobileNavigation />}
		</NoticeProvider>
	)
}
