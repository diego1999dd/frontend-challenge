import type { ComponentProps } from 'react'
import type { Nft } from '@/features/catalog/contracts'
import { cn } from '@/lib/utils'

export function NftArtwork({
	nft,
	className,
	...props
}: { nft: Pick<Nft, 'name' | 'image'> } & ComponentProps<'img'>) {
	return (
		<img
			src={nft.image}
			alt={nft.name}
			width={1254}
			height={1254}
			decoding="async"
			className={cn('block aspect-square w-full object-cover', className)}
			{...props}
		/>
	)
}
