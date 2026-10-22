import { test, expect, type Page } from '@playwright/test'
import { safeRedirect } from '../../src/features/account/safe-redirect'

async function login(page: Page, redirect = '/perfil') {
	await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
	await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
	await page.getByLabel('Senha', { exact: true }).fill('Demo123!')
	await page.locator('.auth-form').getByRole('button', { name: 'Entrar', exact: true }).click()
	await expect(page).toHaveURL(new RegExp(`${redirect}$`))
}

test('galeria seleciona enquadramentos reais e mantém informações corretas', async ({ page }) => {
	await page.goto('/nfts/nft-1')
	const image = page.locator('.detail-main-image img')
	await expect(image).toHaveAttribute('alt', /Arte completa/)
	await page.getByRole('button', { name: 'Ver imagem 2', exact: true }).click()
	await expect(image).toHaveAttribute('alt', /Detalhe central/)
	await expect(image).toHaveCSS('object-view-box', 'inset(20%)')
	await page.getByRole('button', { name: 'Ver imagem 3', exact: true }).focus()
	await page.keyboard.press('Enter')
	await expect(image).toHaveAttribute('alt', /Detalhe superior/)
	if (page.viewportSize()!.width < 768) await page.setViewportSize({ width: 768, height: 1024 })
	await page.getByRole('tab', { name: /Detalhes/i }).click()
	await expect(
		page
			.locator('dt')
			.filter({ hasText: /^Contrato:$/ })
			.locator('..'),
	).toContainText('ERC-721')
	await expect(
		page
			.locator('dt')
			.filter({ hasText: /^Direitos autorais:$/ })
			.locator('..'),
	).toContainText('5%')
	// Exercise a legacy persisted catalogue without resetting accounts or prices.
	await page.evaluate(() => {
		const key = 'kurio-demo-db-v2'
		const db = JSON.parse(localStorage.getItem(key)!)
		delete db.nfts[0].gallery
		db.nfts[0].price = '2.34'
		localStorage.setItem(key, JSON.stringify(db))
	})
	await page.reload()
	await expect(page.getByRole('group', { name: 'Galeria do NFT' }).getByRole('button')).toHaveCount(
		4,
	)
	await expect(page.locator('.detail-heading__price')).toContainText('2.34 ETH')
})

test('reflow em largura equivalente a zoom de 200% preserva conteúdo e navegação', async ({
	page,
}) => {
	for (const redirect of ['//example.com', '/\\example.com', '/\texample.com', '/login'])
		expect(safeRedirect(redirect)).toBe('/')
	expect(safeRedirect('/pagamento?retomar=1')).toBe('/pagamento?retomar=1')
	await login(page)
	const width = Math.max(320, Math.floor(page.viewportSize()!.width / 2))
	await page.setViewportSize({ width, height: 450 })
	for (const path of ['/', '/nfts/nft-1', '/carrinho', '/pagamento', '/perfil', '/carteiras']) {
		await page.goto(path)
		await expect(page.locator('main')).toBeVisible()
		await expect(page.locator('[data-slot="skeleton"]').first()).not.toBeVisible()
		await page.evaluate(() => document.fonts.ready)
		const overflow = await page.evaluate(() =>
			[...document.querySelectorAll('body *')]
				.filter((element) => {
					const box = element.getBoundingClientRect()
					return (
						box.width > 0 &&
						(box.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1)
					)
				})
				.slice(0, 12)
				.map((element) => `${element.className}: ${element.clientWidth}/${element.scrollWidth}`),
		)
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth),
			`${path}: ${JSON.stringify(overflow)}`,
		).toBeLessThanOrEqual(width)
		await expect(page.getByText('Não foi possível abrir esta página', { exact: true })).toHaveCount(
			0,
		)
	}
	const save = page.getByRole('button', { name: 'Salvar carteira', exact: true }).first()
	await save.scrollIntoViewIfNeeded()
	await expect(save).toBeInViewport()
	await save.focus()
	await expect(save).toBeFocused()
})

test('URL omite padrões e filtro de rede consulta NFTs da rede escolhida', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('article')).toHaveCount(9)
	expect(new URL(page.url()).search).toBe('')
	const mobile = page.viewportSize()!.width < 768
	if (mobile) await page.getByRole('button', { name: 'Abrir filtros', exact: true }).click()
	const filters = mobile
		? page.getByRole('dialog')
		: page.getByRole('complementary', { name: 'Filtros de NFTs' })
	await filters.getByRole('button', { name: /^Solana/ }).click()
	if (mobile) await filters.getByRole('button', { name: 'Ver resultados' }).click()
	await expect(page.locator('article[data-network="solana"]')).toHaveCount(9)
	expect(new URL(page.url()).search).toBe('?network=solana')
	await page.reload()
	await expect(page.locator('article[data-network="solana"]')).toHaveCount(9)
	await page.goBack()
	await expect(page.getByRole('article')).toHaveCount(9)
	expect(new URL(page.url()).search).toBe('')
})

test('destaques e relacionados mudam pelos controles do carrossel', async ({ page }) => {
	await page.goto('/')
	const artwork = page.locator('.home-hero__art > img').first()
	const original = await artwork.getAttribute('src')
	await page.getByRole('button', { name: 'Ver destaque 2', exact: true }).click()
	const target = await page
		.getByRole('button', { name: 'Ver destaque 2', exact: true })
		.boundingBox()
	expect(target!.width).toBeGreaterThanOrEqual(24)
	expect(target!.height).toBeGreaterThanOrEqual(24)
	await expect(artwork).not.toHaveAttribute('src', original!)
	await expect(page.getByRole('button', { name: 'Ver destaque 2', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true',
	)
	await page.goto('/nfts/nft-1')
	if (page.viewportSize()!.width < 768) return // Related section is intentionally desktop/tablet only.
	const firstCard = page.locator('.detail-related article a').first()
	await expect(firstCard).toBeVisible()
	const firstHref = await firstCard.getAttribute('href')
	await page.getByRole('button', { name: 'Ver relacionados 2', exact: true }).click()
	await expect(firstCard).not.toHaveAttribute('href', firstHref!)
	await page.getByRole('button', { name: 'Ver relacionados 1', exact: true }).click()
	await expect(firstCard).toHaveAttribute('href', firstHref!)
})

test('senha troca ícone e tipo; movimento reduzido e foco permanecem acessíveis', async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' })
	await page.goto('/login')
	const password = page.getByLabel('Senha', { exact: true })
	await password.fill('Demo123!')
	await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click()
	await expect(password).toHaveAttribute('type', 'text')
	const hide = page.getByRole('button', { name: 'Ocultar senha', exact: true })
	await expect(hide.locator('svg')).toBeVisible()
	await hide.focus()
	await page.keyboard.press('Enter')
	await expect(password).toHaveAttribute('type', 'password')
	await expect(page.getByRole('button', { name: 'Mostrar senha', exact: true })).toBeFocused()
	if (page.viewportSize()!.width < 768) {
		expect(
			await page.locator('.auth-submit').evaluate((el) => getComputedStyle(el).borderRadius),
		).toBe('10px')
	}
	expect(
		await page
			.locator('.password-toggle-icon')
			.evaluate((el) => getComputedStyle(el).animationName),
	).toBe('none')
})

test('aviso Socket.IO desaparece e atualização do NFT continua aplicada', async ({ page }) => {
	await page.goto('/nfts/nft-1')
	await expect(page.getByText('Tempo real conectado', { exact: true })).toBeVisible()
	await page.clock.install()
	await page.evaluate(() => fetch('/api/demo/nfts/nft-1/update', { method: 'POST' }))
	const toast = page.getByRole('status').filter({ hasText: 'Preço ou disponibilidade' })
	await expect(toast).toBeVisible()
	await expect(page.getByRole('button', { name: 'Esgotado', exact: true })).toBeVisible()
	await page.clock.fastForward(6500)
	await expect(toast).toHaveCount(0)
	await expect(page.getByRole('button', { name: 'Esgotado', exact: true })).toBeVisible()
})

test('perfil e carteiras validam os campos obrigatórios também na API', async ({ page }) => {
	await login(page)
	await page.getByLabel('Nome ENS', { exact: true }).fill('')
	await page.getByLabel('Apelido da carteira', { exact: true }).fill('')
	await page.getByRole('button', { name: 'Salvar', exact: true }).click()
	await expect(page.getByText('Use um nome .eth válido.', { exact: true })).toBeVisible()
	await expect(page.getByText('Informe o apelido da carteira.', { exact: true })).toBeVisible()
	await page.getByLabel('Nome ENS', { exact: true }).fill('ana-revisada')
	await page.getByLabel('Apelido da carteira', { exact: true }).fill('Principal revisada')
	await page.getByRole('button', { name: 'Salvar', exact: true }).click()
	await expect(page.getByText('Perfil salvo com sucesso.', { exact: true })).toBeVisible()
	await page.reload()
	await expect(page.getByLabel('Nome ENS', { exact: true })).toHaveValue('ana-revisada')
	await page.goto('/carteiras')
	await expect(page.getByLabel('Rede', { exact: true })).toHaveAttribute('required', '')
	await page.getByLabel('Código de indicação', { exact: true }).fill('')
	await page.getByLabel('E-mail', { exact: true }).fill('inválido')
	await page.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
	await expect(
		page.getByText('Informe o código de indicação fictício.', { exact: true }),
	).toBeVisible()
	await expect(page.getByText('Informe um e-mail válido.', { exact: true })).toBeVisible()
})

test('favorito preenche o coração sem contorno permanente; navegação mobile permite voltar', async ({
	page,
}) => {
	await login(page, '/')
	const mobile = page.viewportSize()!.width < 768
	if (!mobile) await page.goto('/nfts/nft-1')
	const favorite = mobile
		? page
				.getByRole('article')
				.filter({ has: page.getByRole('heading', { name: 'Emerald Ape #042', exact: true }) })
				.locator('.nft-card__favorite')
		: page.locator('.detail-purchase').getByRole('button', { name: 'Favoritar', exact: true })
	await favorite.click()
	await expect(favorite).toHaveAttribute('aria-pressed', 'true')
	await expect(favorite.locator('svg')).toHaveAttribute('fill', 'currentColor')
	await page.locator('h1').click()
	expect(await favorite.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none')
	if (mobile) {
		await page
			.getByRole('navigation', { name: 'Navegação mobile' })
			.getByRole('link', { name: 'Favoritos', exact: true })
			.click()
		await expect(
			page.getByRole('heading', { name: 'Lista de interesse', exact: true }),
		).toBeVisible()
		await page
			.getByRole('navigation', { name: 'Navegação mobile' })
			.getByRole('link', { name: 'Início', exact: true })
			.click()
		await expect(page.getByRole('article')).toHaveCount(9)
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
	}
})

test('favicon e imagem social existem; atualização de chunk recupera uma vez sem loop', async ({
	page,
	request,
}) => {
	const errors: string[] = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto('/')
	await expect(page.getByRole('article')).toHaveCount(9)
	await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
	expect((await request.get('/favicon.svg')).ok()).toBe(true)
	expect((await request.get('/og-image.png')).headers()['content-type']).toContain('image/png')
	await Promise.all([
		page.waitForEvent('load'),
		page.evaluate(() => window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }))),
	])
	await expect(page.getByRole('article')).toHaveCount(9)
	const recoveredAt = await page.evaluate(() => sessionStorage.getItem('kurio-chunk-recovery'))
	expect(Number(recoveredAt)).toBeGreaterThan(0)
	const secondWasPrevented = await page.evaluate(() => {
		const event = new Event('vite:preloadError', { cancelable: true })
		window.dispatchEvent(event)
		return event.defaultPrevented
	})
	expect(secondWasPrevented).toBe(false)
	expect(errors).toEqual([])
})

test('carteira secundária copia a principal, permite outro provedor e persiste', async ({
	page,
}) => {
	await login(page, '/carteiras')
	await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
	const secondary = page.locator('.wallet-form').nth(1)
	await secondary.getByLabel('Igual à carteira principal').check()
	await expect(secondary.getByLabel('Endereço da carteira', { exact: true })).toHaveValue(
		`0x${'1'.repeat(40)}`,
	)
	await secondary.getByLabel('Tipo de carteira', { exact: true }).selectOption('WalletConnect')
	await secondary.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
	await expect(secondary.getByText('Carteira salva com sucesso.', { exact: true })).toBeVisible()
	await page.reload()
	await expect(page.locator('.wallet-form')).toHaveCount(2)
	await expect(
		page.locator('.wallet-form').nth(1).getByLabel('Tipo de carteira', { exact: true }),
	).toHaveValue('WalletConnect')
	await page.goto('/nfts/nft-1')
	await page
		.getByRole('button', {
			name: page.viewportSize()!.width < 768 ? 'Comprar NFT' : 'COMPRAR',
			exact: true,
		})
		.click()
	await expect(page).toHaveURL(/carrinho/)
	await page.goto('/pagamento')
	await page.getByRole('button', { name: 'Conectar com MetaMask', exact: true }).click()
	await page.getByRole('button', { name: 'Autorizar conexão', exact: true }).click()
	await expect(page.getByRole('button', { name: 'Revisar compra', exact: true })).toBeEnabled()
	await page.getByRole('button', { name: 'Conectar com WalletConnect', exact: true }).click()
	await page.getByRole('button', { name: 'Fechar conexão', exact: true }).click()
	await expect(page.getByRole('button', { name: 'Revisar compra', exact: true })).toBeDisabled()
})

test('slider recupera a faixa de preço ao voltar pelo histórico', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('article')).toHaveCount(9)
	const mobile = page.viewportSize()!.width < 768
	if (mobile) await page.getByRole('button', { name: 'Abrir filtros', exact: true }).click()
	const scope = mobile
		? page.getByRole('dialog')
		: page.getByRole('complementary', { name: 'Filtros de NFTs' })
	const min = scope.getByRole('slider', { name: 'Preço mínimo', exact: true })
	await min.focus()
	await page.keyboard.press('ArrowRight')
	await scope.getByRole('button', { name: 'Aplicar', exact: true }).click()
	await expect(page).toHaveURL(/min=0\.03(?:&|$)/)
	await expect(min).toHaveAttribute('aria-valuenow', '0.03')
	await min.focus()
	await page.keyboard.press('ArrowRight')
	await scope.getByRole('button', { name: 'Aplicar', exact: true }).click()
	await expect(page).toHaveURL(/min=0\.04(?:&|$)/)
	await expect(min).toHaveAttribute('aria-valuenow', '0.04')
	await page.goBack()
	await expect(page).toHaveURL(/min=0\.03(?:&|$)/)
	await expect(min).toHaveAttribute('aria-valuenow', '0.03')
})
