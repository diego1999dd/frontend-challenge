import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function preloadMockBootstrap(): Plugin {
	return {
		name: 'kurio-preload-mock-bootstrap',
		apply: 'build',
		transformIndexHtml: {
			order: 'post',
			handler(html, context) {
				const bundle = context.bundle
				if (!bundle) return []
				const worker = Object.values(bundle).find(
					(chunk) =>
						chunk.type === 'chunk' &&
						chunk.facadeModuleId?.replaceAll('\\', '/').endsWith('/src/mocks/browser.ts'),
				)
				if (worker?.type !== 'chunk') return []
				// The demo cannot mount API consumers before MSW is ready. Discover its
				// bootstrap from the HTML instead of waiting for the entry JS to execute.
				// Preload fetches/compiles modules; worker.start() still controls activation.
				const files = new Set<string>()
				const visit = (name: string) => {
					const chunk = bundle[name]
					if (chunk?.type !== 'chunk' || files.has(name)) return
					files.add(name)
					chunk.imports.forEach(visit)
				}
				visit(worker.fileName)
				return [...files]
					.filter((name) => {
						const chunk = bundle[name]
						return chunk.type === 'chunk' && !chunk.isEntry && !html.includes(`href="/${name}"`)
					})
					.map((name) => ({
						tag: 'link',
						attrs: { rel: 'modulepreload', href: `/${name}`, crossorigin: '' },
						injectTo: 'head' as const,
					}))
			},
		},
	}
}

export default defineConfig({
	plugins: [react(), tailwindcss(), preloadMockBootstrap()],
	resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
	server: { port: 5173, strictPort: true },
})
