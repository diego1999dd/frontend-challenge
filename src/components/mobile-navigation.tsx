import { Link } from '@tanstack/react-router'
import { parseCatalogSearch } from '@/features/catalog/contracts'
import { Icon } from './icon'

export function MobileNavigation() {
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
				onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
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
