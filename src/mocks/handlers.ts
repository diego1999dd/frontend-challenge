import { delay, http, HttpResponse } from 'msw'
import { parseCatalogSearch } from '@/features/catalog/contracts'
import { ethToWei } from '@/lib/eth'
import { database, saveDatabase } from './database'
import { accountHandlers } from './account-handlers'
import { realtimeHandler, broadcastNftUpdate } from './realtime'

export const handlers = [
	realtimeHandler,
	...accountHandlers,
	http.get('/api/nfts', async ({ request }) => {
		const url = new URL(request.url)
		const { scenario } = await database()
		if (scenario === 'offline') return HttpResponse.error()
		if (scenario === 'http-error')
			return HttpResponse.json(
				{ code: 'UNAVAILABLE', message: 'Serviço temporariamente indisponível.' },
				{ status: 503 },
			)
		await delay(
			scenario === 'slow'
				? 1800
				: scenario === 'out-of-order' && url.searchParams.get('q')?.length === 1
					? 1500
					: url.searchParams.get('q')
						? 150
						: 300,
		)
		const { nfts } = await database()
		const search = parseCatalogSearch(Object.fromEntries(url.searchParams))
		let items = nfts.filter(
			(nft) =>
				(search.category === 'all' || nft.category === search.category) &&
				`${nft.name} ${nft.creator}`.toLowerCase().includes(search.q.toLowerCase()) &&
				(!search.network || nft.network === search.network) &&
				(!search.min || ethToWei(nft.price) >= ethToWei(search.min)) &&
				(!search.max || ethToWei(nft.price) <= ethToWei(search.max)),
		)
		if (search.sort === 'newest') items = [...items].reverse()
		if (search.sort === 'popular') items = [...items].sort((a, b) => b.available - a.available)
		if (search.sort === 'price-asc' || search.sort === 'price-desc') {
			items = [...items].sort((a, b) => {
				const left = ethToWei(a.price)
				const right = ethToWei(b.price)
				const comparison = left < right ? -1 : left > right ? 1 : 0
				return search.sort === 'price-asc' ? comparison : -comparison
			})
		}
		const pageSize = 9
		const facets = {
			categories: {} as Record<string, number>,
			networks: {} as Record<string, number>,
		}
		nfts.forEach((nft) => {
			facets.categories[nft.category] = (facets.categories[nft.category] || 0) + 1
			facets.networks[nft.network] = (facets.networks[nft.network] || 0) + 1
		})
		return HttpResponse.json({
			items: items.slice((search.page - 1) * pageSize, search.page * pageSize),
			total: items.length,
			page: search.page,
			pageSize,
			facets,
		})
	}),
	http.get('/api/nfts/:id', async ({ params }) => {
		const { scenario } = await database()
		if (scenario === 'offline') return HttpResponse.error()
		if (scenario === 'http-error')
			return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 })
		await delay(scenario === 'slow' ? 1800 : 200)
		const { nfts } = await database()
		const nft = nfts.find((item) => item.id === params.id)
		return nft
			? HttpResponse.json(nft)
			: HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado' }, { status: 404 })
	}),
	http.post('/api/demo/nfts/:id/update', async ({ params, request }) =>
		navigator.locks.request('kurio-mock-database', async () => {
			const db = await database()
			const nft = db.nfts.find((item) => item.id === params.id)
			if (!nft) return new HttpResponse(null, { status: 404 })
			nft.available = Math.max(0, nft.available - 1)
			nft.version += 1
			const body = (await request.json().catch(() => ({}))) as {
				price?: string
				available?: number
				duplicate?: boolean
				stale?: boolean
			}
			if (body.price && /^\d+(\.\d{1,18})?$/.test(body.price)) nft.price = body.price
			if (
				typeof body.available === 'number' &&
				Number.isSafeInteger(body.available) &&
				body.available >= 0
			)
				nft.available = body.available
			saveDatabase(db)
			broadcastNftUpdate({
				eventId: `${nft.id}:${nft.version}`,
				resourceId: nft.id,
				version: nft.version,
				nft,
			})
			if (body.duplicate || body.stale)
				broadcastNftUpdate({
					eventId: `${nft.id}:${nft.version}:replay`,
					resourceId: nft.id,
					version: body.stale ? 1 : nft.version,
					nft,
				})
			return HttpResponse.json(nft)
		}),
	),
]
