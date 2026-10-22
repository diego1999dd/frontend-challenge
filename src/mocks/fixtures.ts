import type { Nft } from '@/features/catalog/contracts'
import { nftImages } from '@/lib/assets'

// PBKDF2-SHA256, 100,000 iterations, 32 bytes, with the fictional v2 salts.
// Precompute the demo seed, not authentication: login/password changes still
// derive and verify their hashes. This avoids repeating fixed work on startup.
export const initialPasswordHashes: Record<string, string> = {
	ana: 'e80f663ecb0fb1b5a612928cbd57af69b04ed35e1a13505c6bef464b6ef2d59c',
	bruno: '9b7983dea804d64cbb240f9a8b6305218bc0a120590d82f1eb5ce5d3be77d255',
}

const artworks = [
	{ name: 'Emerald Ape #042', price: '1.19', image: nftImages.emerald, artworkOffset: 31 },
	{ name: 'Sage Nomad #009', price: '1.69', image: nftImages.sage, artworkOffset: 25 },
	{
		name: 'Neon Vessel #552',
		price: '1.99',
		originalPrice: '2.29',
		image: nftImages.ivory,
		artworkOffset: 24,
		rare: true,
	},
	{
		name: 'Cosmic Bloom #118',
		price: '1.29',
		image: nftImages.sage,
		artworkOffset: 6,
		artworkSize: 'portrait' as const,
	},
	{ name: 'Violet Nomad #314', price: '1.39', image: nftImages.sage, artworkOffset: 24 },
	{ name: 'Ivory Baron #088', price: '1.79', image: nftImages.ivory, artworkOffset: 24 },
	{ name: 'Golden Beat #207', price: '0.99', image: nftImages.golden, artworkOffset: 20 },
	{ name: 'Golden Echo #103', price: '1.09', image: nftImages.golden, artworkOffset: 28 },
	{ name: 'Golden Signal #160', price: '0.39', image: nftImages.golden, artworkOffset: 20 },
]
const categoryValues = [
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

export const initialNfts: Nft[] = Array.from({ length: 36 }, (_, index) => ({
	...artworks[index % 9],
	gallery: [
		{ image: artworks[index % 9].image, label: 'Arte completa', inset: '0%' },
		{ image: artworks[index % 9].image, label: 'Detalhe central', inset: '20%' },
		{ image: artworks[index % 9].image, label: 'Detalhe superior', inset: '0% 20% 40%' },
		{ image: artworks[index % 9].image, label: 'Detalhe inferior', inset: '40% 20% 0%' },
	],
	id: `nft-${index + 1}`,
	name:
		index < 9
			? artworks[index].name
			: `${artworks[index % 9].name.split(' #')[0]} #${String(index + 600).padStart(3, '0')}`,
	creator: ['Nova Sato', 'Luna Oliveira', 'Caio Silva'][index % 3],
	category: categoryValues[index % 9],
	network: ['ethereum', 'polygon', 'solana'][index % 3],
	description:
		'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
	tokenId: index === 0 ? '0042' : String(index + 100).padStart(4, '0'),
	collection: 'Kurio Apes',
	attributes: ['Óculos', 'Esmeralda', 'Raro'],
	editions: ['1/1', '1/10', '1/50', 'ABERTA'],
	unavailableEditions: index === 1 ? ['1/1'] : [],
	rating: '4.8',
	reviewCount: 19,
	details:
		'Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.\n\nA propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
	available: index === 35 ? 0 : (index % 5) + 1,
	version: 1,
}))
