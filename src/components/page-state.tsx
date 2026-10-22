import type { ReactNode } from 'react'
import { SectionHeading } from './section-heading'

interface PageStateProps {
	title: string
	description: string
	kind?: 'empty' | 'error'
	action?: ReactNode
}

export function PageState({ title, description, kind = 'empty', action }: PageStateProps) {
	return (
		<section
			role={kind === 'error' ? 'alert' : undefined}
			className="rounded-card border border-stroke bg-surface p-6 sm:p-8"
		>
			<SectionHeading title={title} description={description} />
			{action && <div className="mt-5">{action}</div>}
		</section>
	)
}
