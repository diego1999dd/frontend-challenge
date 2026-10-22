import { apiError } from '@/features/account/queries'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

export function ApiError({ error, retry }: { error: unknown; retry?: () => void }) {
	if (!error) return null
	return (
		<div role="alert" className="api-feedback">
			<p>{apiError(error)}</p>
			{retry && (
				<Button type="button" variant="outline" onClick={retry}>
					Tentar novamente
				</Button>
			)}
		</div>
	)
}
export function FormSuccess({ children }: { children: React.ReactNode }) {
	return (
		<p role="status" className="text-text-accent">
			{children}
		</p>
	)
}
export function FormSkeleton() {
	return (
		<div aria-label="Carregando dados" role="status" className="grid gap-6">
			<Skeleton className="h-6 w-48" />
			<div className="grid gap-6 sm:grid-cols-2">
				{Array.from({ length: 6 }, (_, index) => (
					<Skeleton key={index} className="h-20 w-full" />
				))}
			</div>
		</div>
	)
}
