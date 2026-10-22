import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import type { Nft } from '@/features/catalog/contracts'
import { NftArtwork } from './nft-artwork'
import { NftPrice } from './nft-price'
import { useFavorite, apiError } from '@/features/account/queries'

export function NftCard({
	nft,
	variant = 'catalog',
}: {
	nft: Nft
	variant?: 'catalog' | 'related'
}) {
	const favorite = useFavorite(nft.id)
	return (
		<article
			data-network={nft.network}
			className={`nft-card nft-card--${variant}`}
			style={{ '--art-offset': `${nft.artworkOffset ?? 24}px` } as React.CSSProperties}
		>
			<Link
				to="/nfts/$nftId"
				params={{ nftId: nft.id }}
				className={`nft-card__art ${nft.artworkSize === 'portrait' ? 'nft-card__art--portrait' : ''}`}
			>
				<NftArtwork nft={nft} loading="lazy" />
				{nft.rare && <span className="nft-card__rare">RARO</span>}
			</Link>
			<div className="nft-card__caption">
				<Link to="/nfts/$nftId" params={{ nftId: nft.id }}>
					<h3>{nft.name}</h3>
				</Link>
				<div className="flex items-center gap-3">
					<NftPrice value={nft.price} />
					{nft.originalPrice && (
						<span className="nft-card__old-price">{nft.originalPrice} ETH</span>
					)}
				</div>
			</div>
			<button
				className="nft-card__favorite"
				aria-label={`${favorite.selected ? 'Remover favorito' : 'Favoritar'} ${nft.name}`}
				aria-pressed={favorite.selected}
				disabled={favorite.pending}
				onClick={favorite.toggle}
			>
				<Heart size={15} fill={favorite.selected ? 'currentColor' : 'none'} />
			</button>
			{favorite.error && (
				<p role="alert" className="nft-card__feedback">
					{apiError(favorite.error)}
				</p>
			)}
		</article>
	)
}
