import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Dialog, Tabs } from 'radix-ui'
import { Heart, ChevronLeft, Search, Star, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NftArtwork } from '@/components/nft/nft-artwork'
import { detailArtworkSizes } from '@/lib/assets'
import { NftCard } from '@/components/nft/nft-card'
import { QuantitySelector } from '@/components/quantity-selector'
import { useNotice } from '@/components/notice-provider'
import { Icon } from '@/components/icon'
import { parseCatalogSearch, type Nft } from '../contracts'
import { catalogOptions } from '../queries'
import { useFavorite, useCartMutation } from '@/features/account/queries'
import { ApiError } from '@/components/api-feedback'
import { useMobile } from '@/lib/use-mobile'

export function RelatedNfts({ id }: { id: string }) {
	const [page, setPage] = useState(1)
	const mobile = useMobile()
	const query = useQuery({ ...catalogOptions(parseCatalogSearch({ page })), enabled: !mobile })
	// This section is not present in the mobile design. Do not fetch/render an
	// invisible catalogue while the actual NFT and its gallery are loading.
	if (mobile) return null
	const items =
		query.data?.items
			.filter(
				(n) =>
					n.id !== id &&
					(page !== 1 || ['nft-4', 'nft-5', 'nft-6', 'nft-7', 'nft-9'].includes(n.id)),
			)
			.slice(0, 5) ?? []
	return (
		<section className="detail-related" data-design="related" aria-labelledby="related-heading">
			<h2 id="related-heading">Mais desta coleção</h2>
			<div aria-busy={query.isFetching}>
				{items.map((nft) => (
					<NftCard key={nft.id} nft={nft} variant="related" />
				))}
			</div>
			<ApiError error={query.error} retry={() => void query.refetch()} />
			<div className="related-dots" role="group" aria-label="Páginas de NFTs relacionados">
				{[1, 2, 3].map((number) => (
					<button
						key={number}
						type="button"
						aria-label={`Ver relacionados ${number}`}
						aria-pressed={page === number}
						onClick={() => setPage(number)}
					/>
				))}
			</div>
		</section>
	)
}

export function NftDetail({ nft }: { nft: Nft }) {
	const [edition, setEdition] = useState('1/50')
	const [quantity, setQuantity] = useState(1)
	const [thumbnail, setThumbnail] = useState(0)
	const gallery = nft.gallery?.length
		? nft.gallery
		: [{ image: nft.image, label: 'Arte completa', inset: '0%' }]
	const selectedImage = gallery[thumbnail] ?? gallery[0]
	const notice = useNotice()
	const navigate = useNavigate()
	const favoriteState = useFavorite(nft.id)
	const favorite = favoriteState.toggle
	const cart = useCartMutation()
	const buy = () => {
		if (cart.isPending) return
		cart.mutate(
			{ method: 'post', path: '/cart/items', body: { nftId: nft.id, edition, quantity } },
			{
				onSuccess: () => {
					void navigate({ to: '/carrinho' })
				},
			},
		)
	}
	const share = async () => {
		try {
			await navigator.clipboard.writeText(location.href)
			notice('Link copiado', 'O endereço deste NFT foi copiado para a área de transferência.')
		} catch {
			notice('Compartilhar NFT', 'Copie o endereço desta página para compartilhar o NFT.')
		}
	}
	return (
		<div className="nft-detail-page">
			<section className="detail-top" data-design="detail-top">
				<nav className="detail-breadcrumb" aria-label="Caminho da página">
					<Link to="/" search={parseCatalogSearch({})}>
						Início
					</Link>{' '}
					/{' '}
					<Link to="/" search={parseCatalogSearch({})} hash="catalogo">
						Mercado
					</Link>
				</nav>
				<div className="detail-product">
					<div className="detail-gallery" data-design="gallery">
						<div className="detail-gallery__mobile-actions">
							<Link to="/" search={parseCatalogSearch({})} aria-label="Voltar ao catálogo">
								<ChevronLeft size={20} />
							</Link>
							<button
								aria-label="Favoritar NFT"
								onClick={favorite}
								aria-pressed={favoriteState.selected}
								disabled={favoriteState.pending}
							>
								<Heart size={20} fill={favoriteState.selected ? 'currentColor' : 'none'} />
							</button>
						</div>
						<div className="detail-thumbnails" role="group" aria-label="Galeria do NFT">
							{gallery.map((image, index) => (
								<button
									aria-label={`Ver imagem ${index + 1}`}
									title={image.label}
									aria-pressed={thumbnail === index}
									onClick={() => setThumbnail(index)}
									key={index}
								>
									<NftArtwork
										nft={{ name: nft.name, image: image.image }}
										alt={image.label}
										style={{ objectViewBox: `inset(${image.inset})` }}
										sizes="100px"
										loading="lazy"
									/>
								</button>
							))}
						</div>
						<div className="detail-main-image">
							<NftArtwork
								nft={{ name: nft.name, image: selectedImage.image }}
								alt={`${nft.name} — ${selectedImage.label}`}
								style={
									selectedImage.inset === '0%'
										? undefined
										: { objectViewBox: `inset(${selectedImage.inset})` }
								}
								sizes={detailArtworkSizes}
								fetchPriority="high"
							/>
						</div>
						<Dialog.Root>
							<Dialog.Trigger className="detail-zoom" aria-label="Ampliar imagem do NFT">
								<Search size={26} />
							</Dialog.Trigger>
							<Dialog.Portal>
								<Dialog.Overlay className="fixed inset-0 z-50 bg-background/90" />
								<Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(800px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2">
									<Dialog.Title className="sr-only">{nft.name} — imagem ampliada</Dialog.Title>
									<Dialog.Description className="sr-only">
										Arte digital da coleção {nft.collection}.
									</Dialog.Description>
									<NftArtwork
										nft={{ name: nft.name, image: selectedImage.image }}
										alt={`${nft.name} — ${selectedImage.label}`}
										style={{ objectViewBox: `inset(${selectedImage.inset})` }}
										sizes="(max-width: 848px) calc(100vw - 48px), 800px"
									/>
									<Dialog.Close
										aria-label="Fechar imagem ampliada"
										className="absolute top-3 right-3 rounded-full bg-surface p-2"
									>
										<X size={22} />
									</Dialog.Close>
								</Dialog.Content>
							</Dialog.Portal>
						</Dialog.Root>
					</div>
					<div className="detail-sheet" data-design="detail-sheet">
						<div className="detail-heading">
							<h1>{nft.name}</h1>
							<div className="detail-heading__price">
								<span>{nft.price} ETH</span>
								<span className="detail-rating">
									<span className="detail-rating__stars" aria-hidden="true">
										{[0, 1, 2, 3, 4].map((index) => (
											<Star key={index} size={15} fill="currentColor" />
										))}
									</span>
									<span className="desktop-copy">
										{nft.reviewCount} avaliações de colecionadores
									</span>
									<span className="mobile-copy">
										{nft.rating}({nft.reviewCount})
									</span>
								</span>
							</div>
						</div>
						<div className="detail-about">
							<h2>Sobre este NFT:</h2>
							<p>
								<span className="desktop-copy">{nft.description}</span>
								<span className="mobile-copy">
									Um colecionável digital {edition} finalizado à mão da coleção Kurio Editions,
									verificado na {nft.network.charAt(0).toUpperCase() + nft.network.slice(1)}.
								</span>
							</p>
						</div>
						<div className="detail-editions">
							<h2>Edição:</h2>
							<div role="group" aria-label="Edição do NFT">
								{nft.editions.map((item) => (
									<button
										key={item}
										aria-pressed={edition === item}
										disabled={!nft.available || nft.unavailableEditions?.includes(item)}
										onClick={() => {
											setEdition(item)
											setQuantity(1)
										}}
									>
										{item}
									</button>
								))}
							</div>
						</div>
						<ApiError error={cart.error || favoriteState.error} />
						<div className="detail-purchase">
							<QuantitySelector
								value={quantity}
								max={edition === '1/1' ? Math.min(1, nft.available) : nft.available}
								onChange={setQuantity}
							/>
							<div>
								<Button disabled={!nft.available || cart.isPending} onClick={buy}>
									{nft.available ? 'COMPRAR' : 'Esgotado'}
								</Button>
								<Button
									variant="outline"
									onClick={favorite}
									aria-pressed={favoriteState.selected}
									disabled={favoriteState.pending}
								>
									<Heart size={20} fill={favoriteState.selected ? 'currentColor' : 'none'} />
									Favoritar
								</Button>
							</div>
						</div>
						<div className="detail-metadata">
							<div>
								<p>ID do token: #{nft.tokenId}</p>
								<p>Coleção: {nft.collection}</p>
								<p>Atributos: {nft.attributes.join(', ')}</p>
							</div>
							<div className="detail-share">
								<span>Compartilhar este NFT:</span>
								<button aria-label="Copiar link do NFT" onClick={() => void share()}>
									<Icon name="linkedin" />
								</button>
								<button aria-label="Compartilhar por e-mail" onClick={() => void share()}>
									<Mail size={18} />
								</button>
								<button aria-label="Compartilhar NFT" onClick={() => void share()}>
									<Icon name="twitter" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>
			<Tabs.Root defaultValue="details" className="detail-description" data-design="description">
				<Tabs.List aria-label="Informações do NFT">
					<Tabs.Trigger value="details">Detalhes do NFT</Tabs.Trigger>
					<Tabs.Trigger value="reviews">
						Avaliações de colecionadores ({nft.reviewCount})
					</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="details">
					<p>
						{nft.name} é uma obra digital {edition} finalizada à mão da coleção Kurio Editions.{' '}
						{nft.details}
					</p>
					<dl>
						<div>
							<dt>Rede:</dt>
							<dd>
								Cunhado na {nft.network.charAt(0).toUpperCase() + nft.network.slice(1)} com
								procedência imutável e metadados armazenados no IPFS.
							</dd>
						</div>
						<div>
							<dt>Direitos autorais:</dt>
							<dd>
								Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos
								mercados compatíveis.
							</dd>
						</div>
						<div>
							<dt>Contrato:</dt>
							<dd>0x7A42...19E8 · Contrato inteligente ERC-721 verificado.</dd>
						</div>
					</dl>
				</Tabs.Content>
				<Tabs.Content value="reviews">
					<p>
						Avaliação da coleção: {nft.rating} de 5, com {nft.reviewCount} avaliações simuladas. A
						listagem de avaliações não faz parte do escopo desta demonstração.
					</p>
				</Tabs.Content>
			</Tabs.Root>
			<RelatedNfts id={nft.id} />
			<div className="detail-buy-bar">
				<div>
					<span className="flex items-center gap-2">
						Qtd.
						<QuantitySelector
							value={quantity}
							max={edition === '1/1' ? Math.min(1, nft.available) : nft.available}
							onChange={setQuantity}
						/>
					</span>
					<strong>{nft.price} ETH</strong>
				</div>
				<div>
					<Button disabled={!nft.available || cart.isPending} onClick={buy}>
						{nft.available ? 'Comprar NFT' : 'Esgotado'}
					</Button>
					<button aria-label="Adicionar ao carrinho" disabled={!nft.available} onClick={buy}>
						<Icon name="shop" />
					</button>
				</div>
			</div>
		</div>
	)
}
