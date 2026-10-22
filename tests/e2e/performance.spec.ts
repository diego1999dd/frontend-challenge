import { expect, test } from '@playwright/test'

test('inicialização de eventos aguarda a arte, permite cancelamento e tem limite de espera', async ({
	page,
}) => {
	// A static local document isolates the readiness utility from React effects.
	await page.goto('/scripts/social-card.html')
	const result = await page.evaluate(async () => {
		const moduleURL = '/src/realtime/after-artwork-paint.ts'
		const { afterArtworkPaint } = await import(moduleURL)
		const wrapper = document.createElement('div')
		wrapper.className = 'detail-main-image'
		const image = document.createElement('img')
		Object.defineProperty(image, 'complete', { get: () => false })
		wrapper.append(image)
		document.body.append(wrapper)
		const frames = () =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() =>
					requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
				),
			)
		let loaded = 0
		const stopLoaded = afterArtworkPaint(() => loaded++)
		await frames()
		const beforeLoad = loaded
		image.dispatchEvent(new Event('load'))
		await frames()
		stopLoaded()
		let cancelled = 0
		const stopCancelled = afterArtworkPaint(() => cancelled++)
		await frames()
		stopCancelled()
		image.dispatchEvent(new Event('load'))
		await frames()
		let fallback = 0
		const stopFallback = afterArtworkPaint(() => fallback++)
		await new Promise((resolve) => setTimeout(resolve, 1150))
		await frames()
		stopFallback()
		wrapper.remove()
		return { beforeLoad, loaded, cancelled, fallback }
	})
	expect(result).toEqual({ beforeLoad: 0, loaded: 1, cancelled: 0, fallback: 1 })
})
