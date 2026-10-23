import { expect, test, type Page } from '@playwright/test'

async function login(page: Page) {
	await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
	await page.getByLabel('Senha', { exact: true }).fill('Demo123!')
	await page.locator('.auth-form').getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function suspendWorker(page: Page) {
	const cdp = await page.context().newCDPSession(page)
	await cdp.send('ServiceWorker.enable')
	await cdp.send('ServiceWorker.stopAllWorkers')
	await cdp.detach()
}

async function addNft(page: Page) {
	await page.goto('/nfts/nft-1')
	await page
		.getByRole('button', {
			name: page.viewportSize()!.width < 768 ? 'Comprar NFT' : 'COMPRAR',
			exact: true,
		})
		.click()
	await expect(page.locator('.cart-item')).toHaveCount(1)
	await expect(page.getByText('Tempo real conectado', { exact: true })).toBeVisible()
}

test('aba suspensa recupera a API, expira para login e preserva a compra', async ({ page }) => {
	test.setTimeout(60_000)
	const errors: string[] = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.clock.install()
	await page.goto('/login?redirect=%2Fperfil')
	await login(page)
	await expect(
		page.getByRole('heading', { name: 'Perfil do colecionador', exact: true }),
	).toBeVisible()
	await addNft(page)
	await page.goto('/pagamento')
	await expect(page.getByRole('button', { name: 'Revisar compra', exact: true })).toBeVisible()
	await suspendWorker(page)
	await page.clock.fastForward(31 * 60_000)
	await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento$/)
	await expect(
		page.getByText('Sua sessão expirou. Entre para retomar de onde parou.'),
	).toBeVisible()
	await login(page)
	await expect(page).toHaveURL(/\/pagamento$/)
	await expect(page.getByRole('button', { name: 'Revisar compra', exact: true })).toBeVisible()
	await page.goto('/carrinho')
	await expect(page.locator('.cart-item')).toHaveCount(1)
	await expect(
		page.getByRole('heading', { name: 'Não foi possível abrir esta página' }),
	).not.toBeVisible()
	expect(errors).toEqual([])
})

test('retomada antes de expirar mantém REST e Socket.IO sem recarregar', async ({ page }) => {
	const errors: string[] = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.clock.install()
	await page.goto('/login?redirect=%2Fperfil')
	await login(page)
	await expect(
		page.getByRole('heading', { name: 'Perfil do colecionador', exact: true }),
	).toBeVisible()
	await addNft(page)
	await suspendWorker(page)
	const recovered = page.waitForResponse(
		(response) =>
			response.url().endsWith('/api/cart') &&
			response.headers()['content-type']?.includes('application/json'),
	)
	await page.clock.fastForward(60_000)
	await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
	await recovered
	await page.evaluate(async () => {
		const response = await fetch('/api/demo/nfts/nft-1/update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ price: '1.25', available: 1, duplicate: true }),
		})
		if (!response.ok) throw new Error('Não foi possível disparar o evento de teste.')
	})
	await expect(
		page.getByRole('status').filter({ hasText: 'Preço ou disponibilidade' }),
	).toBeVisible()
	await expect(page.locator('.cart-item-total')).toContainText('1.25 ETH')
	await expect(page.getByText('Tempo real conectado', { exact: true })).toBeVisible()
	expect(errors).toEqual([])
})

test('resposta HTML de mutation não vira sucesso nem provoca reenvio automático', async ({
	page,
}) => {
	const errors: string[] = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto('/login?redirect=%2Fperfil')
	await login(page)
	await page.getByLabel('Nome ENS', { exact: true }).fill('colecionador')
	await page.getByLabel('Apelido da carteira', { exact: true }).fill('Principal')
	await page.getByLabel('Nome de exibição', { exact: true }).fill('Teste sem reenvio')
	let bypassedMutations = 0
	await page.route('**/api/profile', async (route) => {
		if (route.request().method() !== 'PUT') return route.continue()
		bypassedMutations += 1
		await route.fulfill({
			status: 200,
			contentType: 'text/html',
			body: '<html>SPA fallback</html>',
		})
	})
	await suspendWorker(page)
	await page.getByRole('button', { name: 'Salvar', exact: true }).click()
	await expect(
		page.getByRole('alert').filter({ hasText: 'A API não retornou JSON válido' }),
	).toBeVisible()
	await expect(page.getByText('Perfil salvo com sucesso.', { exact: true })).not.toBeVisible()
	await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue(
		'Teste sem reenvio',
	)
	expect(bypassedMutations).toBe(1)
	await page.unroute('**/api/profile')
	await page.getByRole('button', { name: 'Salvar', exact: true }).click()
	await expect(page.getByText('Perfil salvo com sucesso.', { exact: true })).toBeVisible()
	expect(errors).toEqual([])
})
