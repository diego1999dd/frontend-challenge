import { expect, test } from '@playwright/test'

for (const [name, route] of [
	['cart', '/carrinho'],
	['checkout', '/pagamento'],
	['login', '/login'],
] as const) {
	test(`${name}: regressão visual com dados estáveis`, async ({ page }, testInfo) => {
		if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 414, height: 896 })
		await page.goto('/')
		await expect(page.getByRole('article')).toHaveCount(9)
		if (name !== 'login')
			await page.evaluate(async () => {
				const visitor = localStorage.getItem('kurio-demo-visitor') || ''
				const session = await fetch('/api/session', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': visitor },
					body: JSON.stringify({ email: 'ana@kurio.test', password: 'Demo123!' }),
				}).then((response) => response.json())
				localStorage.setItem('kurio-demo-session', session.token)
				for (const nftId of ['nft-1', 'nft-5', 'nft-6'])
					await fetch('/api/cart/items', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${session.token}`,
							'X-Visitor-Id': visitor,
						},
						body: JSON.stringify({ nftId, edition: '1/50', quantity: 1 }),
					})
			})
		await page.goto(route)
		if (name === 'login') await expect(page.locator('.auth-background article')).toHaveCount(9)
		else await expect(page.locator('.quote-total')).toBeVisible()
		if (name === 'cart') await expect(page.locator('.detail-related article')).toHaveCount(5)
		await page.evaluate(async () => {
			await document.fonts.ready
			await Promise.all(
				[...document.images].map(async (image) => {
					image.loading = 'eager'
					await image.decode()
				}),
			)
		})
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
		await expect(page).toHaveScreenshot(`${name}.png`, {
			fullPage: name !== 'login',
			animations: 'disabled',
			scale: 'css',
		})
	})
}
