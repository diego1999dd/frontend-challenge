export const categories = [
	'all',
	'art',
	'photography',
	'music',
	'3d',
	'collectibles',
	'generative',
	'gaming',
	'memberships',
	'utility',
] as const
export const sorts = ['featured', 'price-asc', 'price-desc', 'newest', 'popular'] as const
export type Category = (typeof categories)[number]
export type Sort = (typeof sorts)[number]

export interface CatalogSearch {
	q: string
	category: Category
	sort: Sort
	page: number
	network: string
	min: string
	max: string
}

export interface Nft {
	id: string
	name: string
	creator: string
	category: Exclude<Category, 'all'>
	description: string
	price: string
	available: number
	version: number
	image: string
	gallery?: { image: string; label: string; inset: string }[]
	network: string
	originalPrice?: string
	rare?: boolean
	artworkOffset?: number
	artworkSize?: 'portrait'
	tokenId: string
	collection: string
	attributes: string[]
	editions: string[]
	unavailableEditions?: string[]
	rating: string
	reviewCount: number
	details: string
}

export interface CatalogResponse {
	items: Nft[]
	total: number
	page: number
	pageSize: number
	facets: { categories: Record<string, number>; networks: Record<string, number> }
}

export interface ApiError {
	code: string
	message: string
	fields?: Record<string, string>
}

export function parseCatalogSearch(input: Record<string, unknown>): CatalogSearch {
	const page = Number(input.page)
	return {
		q: typeof input.q === 'string' ? input.q.slice(0, 100) : '',
		category: categories.includes(input.category as Category)
			? (input.category as Category)
			: 'all',
		sort: sorts.includes(input.sort as Sort) ? (input.sort as Sort) : 'featured',
		page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10_000) : 1,
		network: ['ethereum', 'polygon', 'solana'].includes(String(input.network))
			? String(input.network)
			: '',
		min: typeof input.min === 'string' && /^\d+(\.\d{1,18})?$/.test(input.min) ? input.min : '',
		max: typeof input.max === 'string' && /^\d+(\.\d{1,18})?$/.test(input.max) ? input.max : '',
	}
}
