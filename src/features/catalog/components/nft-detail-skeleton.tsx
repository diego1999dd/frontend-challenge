import { Skeleton } from '@/components/ui/skeleton'

export function NftDetailSkeleton() {
	return (
		<div className="nft-detail-page" aria-label="Carregando NFT" role="status">
			<section className="detail-top">
				<div className="detail-breadcrumb">
					<Skeleton className="h-4 w-44" />
				</div>
				<div className="detail-product">
					<div className="detail-gallery">
						<div className="detail-thumbnails">
							{[0, 1, 2, 3].map((index) => (
								<Skeleton key={index} className="h-[100px] w-[100px] rounded-lg" />
							))}
						</div>
						<Skeleton className="detail-main-image" />
					</div>
					<div className="detail-sheet">
						<Skeleton className="h-[81px] w-full" />
						<Skeleton className="h-[94px] w-full" />
						<Skeleton className="h-14 w-3/4" />
						<Skeleton className="h-[49.5px] w-full" />
						<Skeleton className="h-[114px] w-full" />
					</div>
				</div>
			</section>
			<section className="detail-description">
				<Skeleton className="h-full w-full" />
			</section>
			<section className="detail-related">
				<Skeleton className="h-full w-full" />
			</section>
		</div>
	)
}
