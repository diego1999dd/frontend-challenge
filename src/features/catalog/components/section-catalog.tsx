import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'
import { Search, X } from 'lucide-react'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/page-state'
import { Pagination } from '@/components/pagination'
import { NftGrid } from '@/components/nft/nft-grid'
import { NftCard } from '@/components/nft/nft-card'
import { NftCardSkeleton } from '@/components/nft/nft-card-skeleton'
import { nftImages } from '@/lib/assets'
import { CatalogFilters } from './catalog-filters'
import { catalogOptions } from '../queries'
import { parseCatalogSearch, type CatalogSearch } from '../contracts'

const sortOptions = [
	['featured', 'Listados recentemente'],
	['newest', 'Novos lançamentos'],
	['popular', 'Em alta'],
	['price-asc', 'Menor preço'],
	['price-desc', 'Maior preço'],
] as const

export function CatalogSearchBar() {
	const search = parseCatalogSearch(useSearch({ strict: false }))
	const navigate = useNavigate({ from: '/' })
	return (
		<form className="home-search" role="search" onSubmit={(event) => event.preventDefault()}>
			<Search size={22} />
			<input
				id="catalog-search"
				aria-label="Buscar NFTs"
				type="search"
				placeholder="Explorar coleções"
				value={search.q}
				onChange={(event) =>
					void navigate({ search: (previous) => ({ ...previous, q: event.target.value, page: 1 }) })
				}
			/>
			<a href="#filtros-mobile" className="sr-only">
				Abrir filtros
			</a>
		</form>
	)
}

export function SectionCatalog() {
	const search = parseCatalogSearch(useSearch({ strict: false }))
	const navigate = useNavigate({ from: '/' })
	const [filtersOpen, setFiltersOpen] = useState(false)
	const query = useQuery(catalogOptions(search))
	const update = (patch: Partial<CatalogSearch>) =>
		void navigate({ search: (previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }) })
	const filters = <CatalogFilters search={search} onChange={update} facets={query.data?.facets} />
	return (
		<>
			<div className="home-filter-trigger">
				<Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
					<Dialog.Trigger aria-label="Abrir filtros">
						<Icon name="filter" />
					</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
						<Dialog.Content className="catalog-drawer">
							<div className="flex items-center justify-between">
								<Dialog.Title className="text-lg font-bold">Filtrar NFTs</Dialog.Title>
								<Dialog.Close aria-label="Fechar filtros">
									<X size={22} />
								</Dialog.Close>
							</div>
							<Dialog.Description className="sr-only">
								Combine coleção, faixa de preço e rede.
							</Dialog.Description>
							{filters}
							<label className="flex flex-col gap-2">
								Ordenar por
								<select
									aria-label="Ordenar por"
									value={search.sort}
									className="border border-input bg-surface p-3"
									onChange={(event) =>
										update({ sort: event.target.value as CatalogSearch['sort'] })
									}
								>
									{sortOptions.map(([value, label]) => (
										<option key={value} value={value}>
											{label}
										</option>
									))}
								</select>
							</label>
							<Dialog.Close asChild>
								<Button className="w-full">Ver resultados</Button>
							</Dialog.Close>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			</div>
			<section
				id="catalogo"
				aria-label="Catálogo de NFTs"
				className="home-catalog"
				data-design="products"
			>
				<h2 className="sr-only">Catálogo de NFTs</h2>
				<aside className="home-catalog__sidebar" aria-label="Filtros de NFTs">
					{filters}
					<div className="featured-nft">
						<h3>NFT EM DESTAQUE</h3>
						<p>OFERTA LIMITADA</p>
						<img
							src={nftImages.sage}
							alt="Sage Nomad em destaque"
							width={310}
							height={368}
							loading="lazy"
						/>
					</div>
				</aside>
				<div className="home-catalog__results">
					<div className="catalog-toolbar">
						<div className="catalog-tabs" aria-label="Seleção de NFTs">
							{[
								['featured', 'Todos os NFTs'],
								['newest', 'Novos lançamentos'],
								['popular', 'Em alta'],
							].map(([value, label]) => (
								<button
									key={value}
									aria-pressed={search.sort === value}
									className={search.sort === value ? 'is-active' : ''}
									onClick={() => update({ sort: value as CatalogSearch['sort'] })}
								>
									{label}
								</button>
							))}
						</div>
						<label className="catalog-sort">
							Ordenar por:
							<select
								aria-label="Ordenar por"
								value={search.sort}
								onChange={(event) => update({ sort: event.target.value as CatalogSearch['sort'] })}
							>
								{sortOptions.map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</label>
					</div>
					<div role="status" aria-live="polite" className="sr-only">
						{query.isPending
							? 'Carregando NFTs…'
							: query.isError
								? ''
								: `${query.data.total} NFTs encontrados${query.isFetching ? ' · Atualizando…' : ''}`}
					</div>
					{query.isPending && (
						<NftGrid aria-label="Carregando catálogo">
							{Array.from({ length: 9 }, (_, index) => (
								<NftCardSkeleton key={index} />
							))}
						</NftGrid>
					)}
					{query.isError && (
						<PageState
							kind="error"
							title="Não foi possível carregar o catálogo"
							description="Verifique sua conexão e tente novamente."
							action={<Button onClick={() => void query.refetch()}>Tentar novamente</Button>}
						/>
					)}
					{query.data && query.data.items.length === 0 && (
						<PageState
							title="Nenhum NFT encontrado"
							description="Experimente outro termo ou remova os filtros."
							action={
								<Button
									variant="outline"
									onClick={() => update({ q: '', category: 'all', network: '', min: '', max: '' })}
								>
									Limpar filtros
								</Button>
							}
						/>
					)}
					{query.data && query.data.items.length > 0 && (
						<>
							<NftGrid>
								{query.data.items.map((nft) => (
									<NftCard key={nft.id} nft={nft} />
								))}
							</NftGrid>
							<Pagination
								label="Paginação do catálogo"
								page={search.page}
								pageCount={Math.ceil(query.data.total / query.data.pageSize)}
								onPageChange={(page) => update({ page })}
							/>
						</>
					)}
				</div>
			</section>
		</>
	)
}
