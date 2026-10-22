// Shared by scripts/audit.mjs. The browser is launched through Playwright.
module.exports = {
	runs: 3,
	pages: [
		['home', '/'],
		['detail', '/nfts/nft-1'],
	],
	profiles: ['mobile', 'desktop'],
	targets: { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 },
}
