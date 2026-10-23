import { useState, type ComponentProps } from 'react'
import { FormField } from './form-field'
import { Input, fieldClassName } from './ui/input'
import { Icon } from './icon'
import { Eye } from 'lucide-react'

type FieldProps = ComponentProps<'input'> & { label: string; error?: string; hint?: string }
export function AccountField({ label, error, hint, type, ...props }: FieldProps) {
	const [shown, setShown] = useState(false)
	return (
		<FormField label={label} error={error} hint={hint} required={props.required}>
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
							aria-pressed={shown}
							className="password-toggle"
						>
							<span key={String(shown)} className="password-toggle-icon">
								{shown ? <Eye size={20} /> : <Icon name="hide" />}
							</span>
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
	hint,
	children,
	...props
}: ComponentProps<'select'> & { label: string; error?: string; hint?: string }) {
	return (
		<FormField label={label} error={error} hint={hint} required={props.required}>
			{(aria) => (
				<select {...aria} {...props} className={fieldClassName}>
					{children}
				</select>
			)}
		</FormField>
	)
}
