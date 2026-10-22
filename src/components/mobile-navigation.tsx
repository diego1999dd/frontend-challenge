import { Link, useNavigate } from '@tanstack/react-router'
import { parseCatalogSearch } from '@/features/catalog/contracts'
import { Icon } from './icon'

export function MobileNavigation() {
	const navigate = useNavigate()
	return (
		<nav className="mobile-navigation" aria-label="Navegação mobile">
			<Link to="/" search={parseCatalogSearch({})} aria-label="Início">
				<Icon name="home" />
			</Link>
			<Link to="/favoritos" aria-label="Favoritos">
				<Icon name="heart" />
			</Link>
			<button
				aria-label="Explorar NFTs"
				className="mobile-navigation__explore"
				onClick={() => {
					if (location.pathname !== '/') {
						void navigate({ to: '/', search: parseCatalogSearch({}), hash: 'catalogo' })
					} else
						document.getElementById('catalogo')?.scrollIntoView({
							behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
						})
				}}
			>
				<Icon name="explore" />
			</button>
			<Link to="/carrinho" aria-label="Carrinho de NFTs">
				<Icon name="shop" />
			</Link>
			<Link to="/perfil" aria-label="Perfil do colecionador">
				<Icon name="user" />
			</Link>
		</nav>
	)
}
