import { Link } from '@tanstack/react-router'
import { parseCatalogSearch } from '@/features/catalog/contracts'

// Original wordmark exported from the master component (instance export fails on 0.5).
export function Brand() {
	return (
		<Link to="/" search={parseCatalogSearch({})} aria-label="Kurio — início" className="brand-slot">
			<img src="/images/brand/70486-510.svg" alt="Kurio" />
		</Link>
	)
}
