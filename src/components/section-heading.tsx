import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps extends ComponentProps<'div'> {
	title: string
	as?: 'h1' | 'h2' | 'h3'
	headingId?: string
	eyebrow?: string
	description?: ReactNode
}

export function SectionHeading({
	title,
	as: Heading = 'h2',
	headingId,
	eyebrow,
	description,
	className,
	...props
}: SectionHeadingProps) {
	return (
		<div className={cn('grid gap-3', className)} {...props}>
			{eyebrow && (
				<p className="text-sm font-medium tracking-widest text-primary uppercase">{eyebrow}</p>
			)}
			<Heading
				id={headingId}
				className={cn(
					'font-title font-semibold tracking-tight',
					Heading === 'h1' ? 'text-3xl sm:text-4xl' : 'text-2xl',
				)}
			>
				{title}
			</Heading>
			{description && <p className="text-text-secondary">{description}</p>}
		</div>
	)
}
