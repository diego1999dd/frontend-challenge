import { expect, test } from '@playwright/test'

test('carteiras explicam o endereço por rede, preservam dados e aceitam os exemplos', async ({
	page,
}) => {
	await page.goto('/login?redirect=%2Fcarteiras')
	await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
	await page.getByLabel('Senha', { exact: true }).fill('Demo123!')
	await page.locator('.auth-form').getByRole('button', { name: 'Entrar', exact: true }).click()
	const address = page.getByLabel('Endereço da carteira', { exact: true })
	await page.getByLabel('Nome ENS', { exact: true }).fill('colecionador')
	await page.getByLabel('Código de indicação', { exact: true }).fill('DEMO')
	await expect(page.getByText('Use DEMO para testar.', { exact: false })).toBeVisible()
	await expect(address).toHaveAccessibleDescription(/Ethereum: 0x seguido de 40/)
	await page.getByLabel('Rede', { exact: true }).selectOption('solana')
	await expect(address).toHaveAccessibleDescription(/Solana: 32 a 44 caracteres Base58/)
	await address.fill('0x1')
	await page.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
	await expect(page.getByRole('alert').filter({ hasText: 'Endereço incompatível' })).toContainText(
		'Solana: 32 a 44 caracteres Base58',
	)
	await expect(address).toHaveValue('0x1')
	await expect(address).toHaveAttribute('aria-invalid', 'true')
	await expect(page.getByLabel('Código de indicação', { exact: true })).toHaveValue('DEMO')
	for (const [network, example] of [
		['solana', '11111111111111111111111111111111'],
		['ethereum', '0x1111111111111111111111111111111111111111'],
		['polygon', '0x1111111111111111111111111111111111111111'],
	]) {
		await page.getByLabel('Rede', { exact: true }).selectOption(network)
		await expect(address).toHaveAttribute('placeholder', example)
		await address.fill(example)
		await page.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
		await expect(page.getByText('Carteira salva com sucesso.', { exact: true })).toBeVisible()
		await page.reload()
		await expect(page.getByLabel('Rede', { exact: true })).toHaveValue(network)
		await expect(address).toHaveValue(example)
	}
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('perfil mantém instruções acessíveis com campos preenchidos', async ({ page }) => {
	await page.goto('/login?redirect=%2Fperfil')
	await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
	await page.getByLabel('Senha', { exact: true }).fill('Demo123!')
	await page.locator('.auth-form').getByRole('button', { name: 'Entrar', exact: true }).click()
	await expect(page.getByLabel('Nome de usuário', { exact: true })).toHaveAccessibleDescription(
		/3 a 30/,
	)
	await expect(page.getByLabel('Nome ENS', { exact: true })).toHaveAccessibleDescription(
		/sufixo .eth já está selecionado/,
	)
	await expect(page.getByLabel('Apelido da carteira', { exact: true })).toHaveAccessibleDescription(
		/endereço é cadastrado em Carteiras/,
	)
	await expect(page.getByLabel('Nova senha', { exact: true })).toHaveAccessibleDescription(
		/8 caracteres/,
	)
	await page.getByLabel('Nome de exibição', { exact: true }).fill('Colecionador Teste')
	await page.getByLabel('Nome ENS', { exact: true }).fill('colecionador.eth')
	await page.getByLabel('Apelido da carteira', { exact: true }).fill('Principal')
	await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveAccessibleDescription(
		/Como seu nome aparece/,
	)
	await page.getByRole('button', { name: 'Salvar', exact: true }).click()
	await expect(page.getByText('Perfil salvo com sucesso.', { exact: true })).toBeVisible()
	await page.reload()
	await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue(
		'Colecionador Teste',
	)
	await expect(page.getByLabel('Nome ENS', { exact: true })).toHaveValue('colecionador')
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
