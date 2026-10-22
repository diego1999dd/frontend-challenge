import { test, expect } from '@playwright/test'

for (const [name, path] of [
	['home', '/'],
	['detail', '/nfts/nft-1'],
] as const) {
	test(`${name}: referência visual e geometria do Figma`, async ({ page }, testInfo) => {
		if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 414, height: 896 })
		await page.goto(path)
		await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
		// Related NFTs resolve in a separate query after the detail heading is visible.
		// Wait for that content before enumerating images or capturing the full page.
		if (name === 'detail')
			await expect(page.locator('.detail-related article')).toHaveCount(
				testInfo.project.name === 'mobile' ? 0 : 5,
			)
		await page.evaluate(async () => {
			await document.fonts.ready
			await Promise.all(
				[...document.images].map(async (image) => {
					if (image.loading === 'lazy') image.loading = 'eager'
					await image.decode()
				}),
			)
		})
		if (testInfo.project.name === 'desktop') {
			const expected =
				name === 'home'
					? ([
							['hero', 101, 450],
							['products', 647, 1373],
							['promos', 2116, 250],
							['blog', 2462, 476],
						] as const)
					: ([
							['gallery', 129, 448],
							['description', 673, 340],
							['related', 1109, 407],
						] as const)
			for (const [section, y, height] of expected) {
				const box = await page.locator(`[data-design="${section}"]`).boundingBox()
				expect(box?.y).toBeCloseTo(y, 0)
				expect(box?.height).toBeCloseTo(height, 0)
			}
		}
		await expect(page).toHaveScreenshot(`${name}.png`, {
			fullPage: true,
			animations: 'disabled',
			scale: 'css',
		})
	})
}
