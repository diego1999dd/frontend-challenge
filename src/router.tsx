import {
	createRootRoute,
	createRoute,
	createRouter,
	Link,
	type SearchSchemaInput,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/page-state'
import { MarketplaceLayout } from '@/layouts/marketplace-layout'
import { parseCatalogSearch, type CatalogSearch } from '@/features/catalog/contracts'
import { CatalogPage } from '@/features/catalog/catalog-page'
import { NftPage } from '@/features/catalog/nft-page'

import type { ReactNode } from 'react'
function safeRedirect(value: unknown) {
	return typeof value === 'string' &&
		/^\/(?!\/)/.test(value) &&
		!/^\/(login|cadastro)(?:[/?#]|$)/.test(value)
		? value
		: '/'
}
function AuthPage({ register = false }: { register?: boolean }) { return <PendingPage title={register ? 'Cadastro' : 'Login'} /> }
function ProtectedPage({ children }: { children: ReactNode }) { return <>{children}</> }
function PendingPage({ title = 'Em preparação' }: { title?: string }) { return <PageState title={title} description="Tela prevista para a próxima etapa de integração." /> }
const CartPage = PendingPage
const CheckoutPage = PendingPage
const OrderPage = PendingPage
const OrdersPage = PendingPage
const DemoPage = PendingPage
const ProfilePage = PendingPage
const WalletsPage = PendingPage
const FavoritesPage = PendingPage

const rootRoute = createRootRoute({
	component: MarketplaceLayout,
	notFoundComponent: () => (
		<PageState
			title="Página não encontrada"
			description="Confira o endereço ou volte ao catálogo."
			action={
				<Button asChild variant="outline">
					<Link to="/" search={parseCatalogSearch({})}>
						Voltar ao catálogo
					</Link>
				</Button>
			}
		/>
	),
	errorComponent: ({ reset }) => (
		<PageState
			kind="error"
			title="Não foi possível abrir esta página"
			description="Tente novamente em alguns instantes."
			action={<Button onClick={reset}>Tentar novamente</Button>}
		/>
	),
})

export const catalogRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	validateSearch: (search: Partial<CatalogSearch> & SearchSchemaInput) =>
		parseCatalogSearch({ ...search }),
	component: CatalogPage,
})
export const nftRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/nfts/$nftId',
	component: NftPage,
})

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/login',
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: safeRedirect(search.redirect),
	}),
	component: AuthPage,
})
const registerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/cadastro',
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: safeRedirect(search.redirect),
	}),
	component: () => <AuthPage register />,
})
const profileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/perfil',
	component: () => (
		<ProtectedPage>
			<ProfilePage />
		</ProtectedPage>
	),
})
const walletsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/carteiras',
	component: () => (
		<ProtectedPage>
			<WalletsPage />
		</ProtectedPage>
	),
})
const favoritesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/favoritos',
	component: () => (
		<ProtectedPage>
			<FavoritesPage />
		</ProtectedPage>
	),
})
const cartRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/carrinho',
	component: CartPage,
})
const checkoutRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/pagamento',
	component: () => (
		<ProtectedPage>
			<CheckoutPage />
		</ProtectedPage>
	),
})
const ordersRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/pedidos',
	component: () => (
		<ProtectedPage>
			<OrdersPage />
		</ProtectedPage>
	),
})
const orderRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/pedidos/$orderId',
	component: () => (
		<ProtectedPage>
			<OrderPage />
		</ProtectedPage>
	),
})
const demoRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/demo',
	component: DemoPage,
})
export const router = createRouter({
	routeTree: rootRoute.addChildren([
		catalogRoute,
		nftRoute,
		loginRoute,
		registerRoute,
		profileRoute,
		walletsRoute,
		favoritesRoute,
		cartRoute,
		checkoutRoute,
		ordersRoute,
		orderRoute,
		demoRoute,
	]),
	defaultPreload: 'intent',
	scrollRestoration: true,
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
