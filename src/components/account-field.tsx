import { useState, type ComponentProps } from 'react'
import { FormField } from './form-field'
import { Input, fieldClassName } from './ui/input'
import { Icon } from './icon'

type FieldProps = ComponentProps<'input'> & { label: string; error?: string; hint?: string }
export function AccountField({ label, error, hint, type, ...props }: FieldProps) {
	const [shown, setShown] = useState(false)
	return (
		<FormField label={label} error={error} hint={hint}>
			{(aria) => (
				<div className="account-field-input">
					<Input {...aria} {...props} type={type === 'password' && shown ? 'text' : type} />
					{type === 'password' && (
						<button
							type="button"
							aria-label={
								shown ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`
							}
							onClick={() => setShown(!shown)}
						>
							<Icon name="hide" />
						</button>
					)}
				</div>
			)}
		</FormField>
	)
}
export function AccountSelect({
	label,
	error,
	children,
	...props
}: ComponentProps<'select'> & { label: string; error?: string }) {
	return (
		<FormField label={label} error={error}>
			{(aria) => (
				<select {...aria} {...props} className={fieldClassName}>
					{children}
				</select>
			)}
		</FormField>
	)
}
