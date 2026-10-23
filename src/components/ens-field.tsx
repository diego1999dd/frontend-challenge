import { useState } from 'react'
import { FormField } from './form-field'
import { Input, fieldClassName } from './ui/input'

export function EnsField({
	defaultValue = '',
	error,
	required = true,
	readOnly = false,
	hint,
}: {
	defaultValue?: string
	error?: string
	required?: boolean
	readOnly?: boolean
	hint?: string
}) {
	const [value, setValue] = useState(defaultValue.replace(/\.eth$/i, ''))
	const ens = value.trim() ? `${value.trim().replace(/\.eth$/i, '')}.eth` : ''
	return (
		<FormField label="Nome ENS" error={error} hint={hint} required={required}>
			{(aria) => (
				<div className="ens-field">
					<select
						className={fieldClassName}
						aria-label="Sufixo ENS"
						value=".eth"
						onChange={() => {}}
						disabled={readOnly}
					>
						<option value=".eth">.eth</option>
					</select>
					<Input
						{...aria}
						value={value}
						onChange={(event) => setValue(event.target.value)}
						required={required}
						readOnly={readOnly}
						placeholder={readOnly ? undefined : 'colecionador'}
						autoCapitalize="none"
						autoCorrect="off"
					/>
					<input type="hidden" name="ens" value={ens} />
				</div>
			)}
		</FormField>
	)
}
