import { ChevronRight, ChevronLeft } from 'lucide-react'

interface PaginationProps {
	page: number
	pageCount: number
	onPageChange: (page: number) => void
	label?: string
}
export function Pagination({
	page,
	pageCount,
	onPageChange,
	label = 'Paginação',
}: PaginationProps) {
	const start = Math.max(1, Math.min(page - 1, pageCount - 3))
	return (
		<nav aria-label={label} className="catalog-pagination">
			{page > 1 && (
				<button aria-label="Anterior" onClick={() => onPageChange(page - 1)}>
					<ChevronLeft size={18} />
				</button>
			)}
			{Array.from({ length: Math.min(4, pageCount) }, (_, index) => start + index).map((number) => (
				<button
					key={number}
					aria-current={page === number ? 'page' : undefined}
					onClick={() => onPageChange(number)}
				>
					{number}
				</button>
			))}
			<button
				aria-label="Próxima"
				disabled={page >= pageCount}
				onClick={() => onPageChange(page + 1)}
			>
				<ChevronRight size={18} />
			</button>
			<span className="sr-only">
				Página {page} de {pageCount}
			</span>
		</nav>
	)
}
