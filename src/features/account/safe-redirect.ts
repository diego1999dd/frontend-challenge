export function safeRedirect(value: unknown) {
	return typeof value === 'string' &&
		/^\/(?!\/)/.test(value) &&
		!value.includes('\\') &&
		![...value].some(
			(character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
		) &&
		!/^\/(login|cadastro)(?:[/?#]|$)/.test(value)
		? value
		: '/'
}
