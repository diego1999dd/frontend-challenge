import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
	value: number
	max: number
	onChange: (value: number) => void
	disabled?: boolean
}
export function QuantitySelector({
	value,
	max,
	onChange,
	disabled = false,
}: QuantitySelectorProps) {
	return (
		<div className="quantity-selector" role="group" aria-label="Quantidade de edições">
			<button
				aria-label="Diminuir quantidade"
				disabled={disabled || value <= 1 || max === 0}
				onClick={() => onChange(value - 1)}
			>
				<Minus size={20} />
			</button>
			<output aria-live="polite">{value}</output>
			<button
				aria-label="Aumentar quantidade"
				disabled={disabled || value >= max}
				onClick={() => onChange(value + 1)}
			>
				<Plus size={20} />
			</button>
		</div>
	)
}
