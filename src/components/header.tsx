import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { Icon } from './icon'
import { parseCatalogSearch } from '@/features/catalog/contracts'
import { Brand } from './brand'
import { useNotice } from './notice-provider'
import { Button } from './ui/button'
import { useSession } from '@/features/account/session-context'
import { useCart } from '@/features/account/queries'

interface HeaderProps {
	active?: 'Home' | 'Market'
	badgeCount?: number
}

export function Header({ active, badgeCount }: HeaderProps) {
	const { user } = useSession()
	const cart = useCart()
	const count =
		badgeCount ?? cart.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
	const pathname = useRouterState({ select: (state) => state.location.pathname })
	const currentSearch = useRouterState({ select: (state) => state.location.search })
	const selected =
		active ??
		(['/', '/login', '/cadastro'].includes(pathname)
			? 'Home'
			: pathname.startsWith('/nfts/') || ['/carrinho', '/pagamento'].includes(pathname)
				? 'Market'
				: undefined)
	const notice = useNotice()
	const navigate = useNavigate()
	const [searchOpen, setSearchOpen] = useState(false)
	return (
		<header className="market-header" data-design="header">
			<Brand />
			<nav aria-label="Principal" className="market-header__nav">
				<Link
					to="/"
					search={parseCatalogSearch({})}
					className={selected === 'Home' ? 'is-active' : ''}
				>
					Início
				</Link>
				<Link
					to="/"
					search={parseCatalogSearch({})}
					hash="catalogo"
					className={selected === 'Market' ? 'is-active' : ''}
				>
					Mercado
				</Link>
				<button
					onClick={() =>
						notice('Criadores', 'A página de criadores não faz parte do escopo deste teste.')
					}
				>
					Criadores
				</button>
				<button
					onClick={() =>
						notice('Aprenda', 'As páginas editoriais não fazem parte do escopo deste teste.')
					}
				>
					Aprenda
				</button>
			</nav>
			<div className="market-header__actions">
				<Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
					<Dialog.Trigger aria-label="Buscar NFTs">
						<Icon name="search" />
					</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
						<Dialog.Content className="fixed top-24 left-1/2 z-50 w-[min(600px,calc(100%-48px))] -translate-x-1/2 border border-stroke bg-surface p-6">
							<Dialog.Title className="mb-4 font-bold">Buscar NFTs</Dialog.Title>
							<Dialog.Description className="sr-only">
								Busque pelo nome da obra ou do criador.
							</Dialog.Description>
							<form
								onSubmit={(event) => {
									event.preventDefault()
									const q = String(new FormData(event.currentTarget).get('q') || '')
									void navigate({
										to: '/',
										search: parseCatalogSearch({ ...currentSearch, q, page: 1 }),
									})
									setSearchOpen(false)
								}}
							>
								<input
									type="search"
									name="q"
									aria-label="Buscar NFTs"
									placeholder="Nome da obra ou criador"
									className="w-full border border-input bg-background p-3"
								/>
								<Button className="mt-4">Buscar</Button>
							</form>
							<Dialog.Close className="absolute top-3 right-3" aria-label="Fechar busca">
								×
							</Dialog.Close>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
				<Link to="/carrinho" className="relative" aria-label="Carrinho de NFTs">
					<Icon name="cart" />
					<span className="cart-badge">{count}</span>
				</Link>
				<Button
					className="h-[35px] min-w-[100px] rounded-sm px-2 text-base"
					onClick={() =>
						user
							? void navigate({ to: '/perfil' })
							: void navigate({ to: '/login', search: { redirect: pathname } })
					}
				>
					<Icon name="login" />
					{user ? 'Perfil' : 'Entrar'}
				</Button>
			</div>
		</header>
	)
}
