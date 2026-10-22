import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function NftGrid({ className, ...props }: ComponentProps<'div'>) {
	return <div className={cn('nft-grid', className)} {...props} />
}
