import { Skeleton } from '@/components/ui/skeleton'

export function NftCardSkeleton() {
	return (
		<div className="nft-card" aria-hidden="true">
			<Skeleton className="nft-card__art" />
			<Skeleton className="mt-3 h-4 w-3/4" />
			<Skeleton className="mt-3 h-4 w-1/2" />
		</div>
	)
}
