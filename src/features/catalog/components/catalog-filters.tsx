import { useState } from 'react'
import { Slider } from 'radix-ui'
import { Button } from '@/components/ui/button'
import type { CatalogResponse, CatalogSearch } from '../contracts'

export const collectionOptions = [
	['art', 'Arte digital'],
	['photography', 'Fotografia'],
	['music', 'Música'],
	['3d', 'Arte 3D'],
	['collectibles', 'Colecionáveis'],
	['generative', 'Generativa'],
	['gaming', 'Jogos'],
	['memberships', 'Assinaturas'],
	['utility', 'Utilidade'],
] as const

interface CatalogFiltersProps {
	search: CatalogSearch
	onChange: (patch: Partial<CatalogSearch>) => void
	facets?: CatalogResponse['facets']
}
export function CatalogFilters({ search, onChange, facets }: CatalogFiltersProps) {
	const [price, setPrice] = useState([Number(search.min || '0.02'), Number(search.max || '12.30')])
	return (
		<div className="catalog-filters">
			<section>
				<h3>Coleções</h3>
				<ul>
					{collectionOptions.map(([value, label]) => (
						<li key={value}>
							<button
								aria-pressed={search.category === value}
								className={
									search.category === value || (search.category === 'all' && value === 'art')
										? 'is-active'
										: ''
								}
								onClick={() => onChange({ category: search.category === value ? 'all' : value })}
							>
								<span>{label}</span>
								<span>({facets?.categories[value] ?? '—'})</span>
							</button>
						</li>
					))}
				</ul>
			</section>
			<section>
				<h3>Faixa de preço</h3>
				<div className="catalog-price">
					<Slider.Root
						value={price}
						onValueChange={setPrice}
						min={0.02}
						max={20}
						step={0.01}
						minStepsBetweenThumbs={1}
						className="price-slider"
					>
						<Slider.Track className="price-slider__track">
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb aria-label="Preço mínimo" />
						<Slider.Thumb aria-label="Preço máximo" />
					</Slider.Root>
					<p>
						Preço: {price[0].toFixed(2).replace('.', ',')} - {price[1].toFixed(2).replace('.', ',')}{' '}
						ETH
					</p>
					<Button onClick={() => onChange({ min: price[0].toFixed(2), max: price[1].toFixed(2) })}>
						Aplicar
					</Button>
				</div>
			</section>
			<section>
				<h3>Rede</h3>
				<ul>
					{[
						['ethereum', 'Ethereum'],
						['polygon', 'Polygon'],
						['solana', 'Solana'],
					].map(([value, label]) => (
						<li key={value}>
							<button
								aria-pressed={search.network === value}
								className={search.network === value ? 'is-active' : ''}
								onClick={() => onChange({ network: search.network === value ? '' : value })}
							>
								<span>{label}</span>
								<span>({facets?.networks[value] ?? '—'})</span>
							</button>
						</li>
					))}
				</ul>
			</section>
			{(search.category !== 'all' || search.network || search.min || search.max || search.q) && (
				<Button
					variant="outline"
					onClick={() => {
						setPrice([0.02, 12.3])
						onChange({ category: 'all', network: '', min: '', max: '', q: '' })
					}}
				>
					Limpar filtros
				</Button>
			)}
		</div>
	)
}
