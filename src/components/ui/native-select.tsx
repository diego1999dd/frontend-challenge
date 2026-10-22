import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { fieldClassName } from './input'

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
	return (
		<select
			data-slot="native-select"
			className={cn(fieldClassName, 'pr-8', className)}
			{...props}
		/>
	)
}
