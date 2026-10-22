import {
	createRootRoute,
	createRoute,
	createRouter,
	Link,
	type SearchSchemaInput,
} from '@tanstack/react-router'
import { lazy, Suspense, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { FormSkeleton } from '@/components/api-feedback'
import { PageState } from '@/components/page-state'
import { MarketplaceLayout } from '@/layouts/marketplace-layout'
import { parseCatalogSearch, type CatalogSearch } from '@/features/catalog/contracts'
import { CatalogPage } from '@/features/catalog/catalog-page'
import { NftPage } from '@/features/catalog/nft-page'
import { safeRedirect } from '@/features/account/safe-redirect'
import { ProtectedPage } from '@/features/account/protected-page'

const AuthPage = lazy(() =>
	import('@/features/account/auth-page').then(({ AuthPage }) => ({ default: AuthPage })),
)
const ProfilePage = lazy(() =>
	import('@/features/account/profile-page').then(({ ProfilePage }) => ({ default: ProfilePage })),
)
const WalletsPage = lazy(() =>
	import('@/features/account/wallets-page').then(({ WalletsPage }) => ({ default: WalletsPage })),
)
const FavoritesPage = lazy(() =>
	import('@/features/account/favorites-page').then(({ FavoritesPage }) => ({
		default: FavoritesPage,
	})),
)
const CartPage = lazy(() =>
	import('@/features/commerce/cart-page').then(({ CartPage }) => ({ default: CartPage })),
)
const CheckoutPage = lazy(() =>
	import('@/features/commerce/checkout-page').then(({ CheckoutPage }) => ({
		default: CheckoutPage,
	})),
)
const OrdersPage = lazy(() =>
	import('@/features/commerce/orders-page').then(({ OrdersPage }) => ({ default: OrdersPage })),
)
const OrderPage = lazy(() =>
	import('@/features/commerce/orders-page').then(({ OrderPage }) => ({ default: OrderPage })),
)
const DemoPage = lazy(() =>
	import('@/features/commerce/demo-page').then(({ DemoPage }) => ({ default: DemoPage })),
)

function DeferredPage({ children }: { children: ReactNode }) {
	return <Suspense fallback={<FormSkeleton />}>{children}</Suspense>
}

function PrivatePage({ children }: { children: ReactNode }) {
	return (
		<ProtectedPage>
			<DeferredPage>{children}</DeferredPage>
		</ProtectedPage>
	)
}

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
	component: () => (
		<DeferredPage>
			<AuthPage />
		</DeferredPage>
	),
})
const registerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/cadastro',
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: safeRedirect(search.redirect),
	}),
	component: () => (
		<DeferredPage>
			<AuthPage register />
		</DeferredPage>
	),
})
const profileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/perfil',
	component: () => (
		<PrivatePage>
			<ProfilePage />
		</PrivatePage>
	),
})
const walletsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/carteiras',
	component: () => (
		<PrivatePage>
			<WalletsPage />
		</PrivatePage>
	),
})
const favoritesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/favoritos',
	component: () => (
		<PrivatePage>
			<FavoritesPage />
		</PrivatePage>
	),
})
const cartRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/carrinho',
	component: () => (
		<DeferredPage>
			<CartPage />
		</DeferredPage>
	),
})
const checkoutRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/pagamento',
	component: () => (
		<PrivatePage>
			<CheckoutPage />
		</PrivatePage>
	),
})
const ordersRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/pedidos',
	component: () => (
		<PrivatePage>
			<OrdersPage />
		</PrivatePage>
	),
})
const orderRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/pedidos/$orderId',
	component: () => (
		<PrivatePage>
			<OrderPage />
		</PrivatePage>
	),
})
const demoRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/demo',
	component: () => (
		<DeferredPage>
			<DemoPage />
		</DeferredPage>
	),
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
