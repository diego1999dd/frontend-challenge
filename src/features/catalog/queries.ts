import { queryOptions } from '@tanstack/react-query'
import { http } from '@/lib/http'
import type { CatalogResponse, CatalogSearch, Nft } from './contracts'

export const catalogKeys = {
	all: ['nfts'] as const,
	list: (search: CatalogSearch) => ['nfts', 'list', search] as const,
	detail: (id: string) => ['nfts', 'detail', id] as const,
}

export function catalogOptions(search: CatalogSearch) {
	return queryOptions({
		queryKey: catalogKeys.list(search),
		queryFn: async ({ signal }) =>
			(await http.get<CatalogResponse>('/nfts', { params: search, signal })).data,
	})
}

export function nftOptions(id: string) {
	return queryOptions({
		queryKey: catalogKeys.detail(id),
		queryFn: async ({ signal }) =>
			(await http.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
	})
}
