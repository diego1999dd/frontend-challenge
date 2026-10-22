import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const fieldClassName =
	'min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-text-accent'

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
	return (
		<input data-slot="input" type={type} className={cn(fieldClassName, className)} {...props} />
	)
}
