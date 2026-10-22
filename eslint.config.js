import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
	{
		ignores: [
			'dist',
			'public/mockServiceWorker.js',
			'playwright-report',
			'reports',
			'test-results',
			'.lighthouseci',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{ files: ['*.cjs', 'scripts/**/*.{js,mjs}'], languageOptions: { globals: globals.node } },
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
		rules: {
			...reactHooks.configs.recommended.rules,
			'react-refresh/only-export-components': 'off',
		},
	},
)
