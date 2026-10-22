import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface NftPriceProps extends ComponentProps<'span'> {
	value: string
}

export function NftPrice({ value, className, ...props }: NftPriceProps) {
	return (
		<span className={cn('font-medium text-text-accent tabular-nums', className)} {...props}>
			{value} ETH
		</span>
	)
}
