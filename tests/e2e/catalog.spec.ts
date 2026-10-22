import { test, expect, type Page } from '@playwright/test'

async function category(page: Page, name: string, sort?: string) {
	const mobile = page.viewportSize()!.width < 768
	if (mobile) await page.getByRole('button', { name: 'Abrir filtros', exact: true }).click()
	const scope = mobile
		? page.getByRole('dialog')
		: page.getByRole('complementary', { name: 'Filtros de NFTs' })
	await scope.getByRole('button', { name: new RegExp(`^${name}`) }).click()
	if (sort)
		await (mobile ? scope : page).getByLabel('Ordenar por', { exact: true }).selectOption(sort)
	if (mobile) await scope.getByRole('button', { name: 'Ver resultados' }).click()
}

test('filtros, ordenação, paginação e histórico sobrevivem ao refresh', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('article')).toHaveCount(9)
	await page.getByRole('button', { name: 'Próxima', exact: true }).click()
	await expect(page.getByText('Página 2 de 4')).toBeVisible()
	await category(page, 'Arte digital', 'price-desc')
	await expect(page.getByRole('article')).toHaveCount(4)
	await expect(page).toHaveURL(/sort=price-desc/)
	const mobile = page.viewportSize()!.width < 768
	if (!mobile) await page.getByRole('button', { name: 'Buscar NFTs', exact: true }).click()
	await page.getByRole('searchbox', { name: 'Buscar NFTs', exact: true }).fill('Emerald Ape #042')
	if (!mobile) await page.getByRole('searchbox').press('Enter')
	await expect(page.getByRole('article')).toHaveCount(1)
	await page.reload()
	await expect(page.getByRole('article')).toHaveCount(1)
	await expect(page).toHaveURL(/category=art/)
	await expect(page).toHaveURL(/sort=price-desc/)
	await expect(page).toHaveURL(/q=Emerald/)
	await category(page, 'Música')
	await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
	await page.goBack()
	await expect(page.getByRole('article')).toHaveCount(1)
	await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('acesso direto ao detalhe e recurso inexistente', async ({ page }) => {
	await page.goto('/nfts/nft-1')
	await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
	await page.reload()
	await expect(page.locator('main')).toContainText('1.19 ETH')
	await page.goto('/nfts/inexistente')
	await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})

test('catálogo e detalhe não causam overflow horizontal', async ({ page }) => {
	for (const path of ['/', '/nfts/nft-1']) {
		await page.goto(path)
		await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
	}
})

test('atualização MSW passa pelo Socket.IO e reconcilia com REST', async ({ page }) => {
	await page.goto('/nfts/nft-1')
	await expect(page.getByText('Tempo real conectado', { exact: false })).toBeVisible()
	await page.evaluate(async () => {
		const response = await fetch('/api/demo/nfts/nft-1/update', { method: 'POST' })
		if (!response.ok) throw new Error('Falha ao disparar cenário')
	})
	await expect(page.getByRole('button', { name: 'Esgotado', exact: true })).toBeVisible()
	await expect(
		page.getByRole('status').filter({ hasText: 'Preço ou disponibilidade' }),
	).toContainText('Emerald Ape #042 atualizado.')
})

test('diálogos restauram foco e compra adiciona o NFT ao carrinho', async ({ page }) => {
	const mobile = page.viewportSize()!.width < 768
	await page.goto(mobile ? '/' : '/nfts/nft-1')
	const trigger = page.getByRole('button', {
		name: mobile ? 'Abrir filtros' : 'Ampliar imagem do NFT',
		exact: true,
	})
	await trigger.click()
	await expect(page.getByRole('dialog')).toBeVisible()
	await page.keyboard.press('Escape')
	await expect(trigger).toBeFocused()
	if (mobile) await page.goto('/nfts/nft-1')
	await page.getByRole('button', { name: mobile ? 'Comprar NFT' : 'COMPRAR', exact: true }).click()
	await expect(page).toHaveURL(/\/carrinho/)
	await expect(page.getByRole('article', { name: /Emerald Ape #042/ })).toContainText('1.19 ETH')
})
