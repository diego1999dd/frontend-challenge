export function safeRedirect(value: unknown) {
	return typeof value === 'string' &&
		/^\/(?!\/)/.test(value) &&
		!/^\/(login|cadastro)(?:[/?#]|$)/.test(value)
		? value
		: '/'
}
