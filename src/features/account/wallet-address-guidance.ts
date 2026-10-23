import type { Network } from './contracts'

const evmExample = '0x1111111111111111111111111111111111111111'

export const walletAddressGuidance: Record<Network, { example: string; format: string }> = {
	ethereum: {
		example: evmExample,
		format: 'Ethereum: 0x seguido de 40 caracteres hexadecimais (0–9, a–f).',
	},
	polygon: {
		example: evmExample,
		format: 'Polygon: 0x seguido de 40 caracteres hexadecimais (0–9, a–f).',
	},
	solana: {
		example: '11111111111111111111111111111111',
		format: 'Solana: 32 a 44 caracteres Base58, sem prefixo 0x e sem 0, O, I ou l.',
	},
}
