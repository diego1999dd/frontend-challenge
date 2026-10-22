/* global document */
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Run with pnpm dev:mocks active; optionally pass its URL as the first argument.
const baseURL = process.argv[2] || 'http://127.0.0.1:5173'
const browser = await chromium.launch()
try {
	const page = await browser.newPage({
		viewport: { width: 1200, height: 630 },
		deviceScaleFactor: 1,
	})
	await page.goto(`${baseURL}/scripts/social-card.html`)
	await page.setContent(
		readFileSync(new URL('./social-card.html', import.meta.url), 'utf8').replaceAll(
			'http://127.0.0.1:5173',
			baseURL,
		),
	)
	await page.evaluate(async () => {
		await document.fonts.ready
		await Promise.all([...document.images].map((image) => image.decode()))
	})
	await page.screenshot({ path: fileURLToPath(new URL('../public/og-image.png', import.meta.url)) })
} finally {
	await browser.close()
}
