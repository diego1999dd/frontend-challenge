import type { QueryClient } from '@tanstack/react-query'
import { parseCatalogSearch } from './contracts'
import { catalogOptions, nftOptions } from './queries'
import { detailArtworkSizes, nftImageSrcSet } from '@/lib/assets'

// Begin the same Query request used by the page while React is still mounting.
// This must run only after MSW is ready; it never bypasses the HTTP layer.
export function preloadInitialCatalog(
	client: QueryClient,
	location: { pathname: string; search: Record<string, unknown> },
) {
	if (location.pathname === '/') {
		const search = parseCatalogSearch(location.search)
		void client.prefetchQuery(catalogOptions(search))
		return
	}
	const detail = /^\/nfts\/([^/]+)\/?$/.exec(location.pathname)
	if (!detail) return
	try {
		void client
			.fetchQuery(nftOptions(decodeURIComponent(detail[1])))
			.then((nft) => {
				const image = new Image()
				image.fetchPriority = 'high'
				image.sizes = detailArtworkSizes
				image.srcset = nftImageSrcSet(nft.image) || ''
				image.src = nft.image
			})
			.catch(() => {
				// The page observes the same query and renders its normal error state.
			})
	} catch {
		// Malformed URL encoding is left to the router's normal error handling.
	}
}
