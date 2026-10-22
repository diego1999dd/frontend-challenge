// High-quality AVIF delivery copies of the original Figma fills. PNG sources are retained.
export const nftImages = {
	emerald: '/images/nfts/8459204731e6eba9d474cbc8ebc37071360d3ba5.avif',
	sage: '/images/nfts/2986a7cb16d09de8970824d2dd58bf0bb021702c.avif',
	ivory: '/images/nfts/9df2ff42dd27ba657621c304557d1a855a4be6a5.avif',
	golden: '/images/nfts/87580f2def9af0ce13f4b6f6ce17bb2449bcfc16.avif',
} as const

const responsiveImages = new Set<string>(Object.values(nftImages))
export const detailArtworkSizes =
	'(max-width: 767px) calc(100vw - 53px), (max-width: 1279px) calc(46vw - 112px), 404px'
export const cardArtworkSizes =
	'(max-width: 767px) calc((100vw - 64px) / 2), (max-width: 1199px) 28vw, 262px'

export function nftImageSrcSet(image: string) {
	if (!responsiveImages.has(image)) return undefined
	const base = image.slice(0, -5)
	return `${base}-384.avif 384w, ${base}-768.avif 768w, ${image} 1254w`
}
