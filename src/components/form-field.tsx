import { useId, type ReactNode } from 'react'

interface FormFieldProps {
	className?: string
	label: string
	hint?: string
	error?: string
	required?: boolean
	children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => ReactNode
}

export function FormField({ label, hint, error, children, className, required }: FormFieldProps) {
	const id = useId()
	const hintId = `${id}-hint`
	const errorId = `${id}-error`
	const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
	return (
		<div className={`grid min-w-0 gap-2 text-sm ${className || ''}`}>
			<label htmlFor={id} data-required={required || undefined}>
				{label}
			</label>
			{children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
			{hint && (
				<p id={hintId} className="text-xs text-text-secondary">
					{hint}
				</p>
			)}
			{error && (
				<p id={errorId} role="alert" className="text-xs text-text-accent">
					{error}
				</p>
			)}
		</div>
	)
}
