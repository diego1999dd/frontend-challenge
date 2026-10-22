// ETH uses 18 decimal places. Never convert monetary values to Number.
export function ethToWei(value: string): bigint {
	if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('Valor ETH inválido')
	const [whole, fraction = ''] = value.split('.')
	return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'))
}
