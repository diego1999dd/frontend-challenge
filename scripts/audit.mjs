import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { createServer } from 'node:net'
import os from 'node:os'
import { chromium } from '@playwright/test'

const require = createRequire(import.meta.url)
const configuration = require('../lighthouserc.cjs')
const lighthousePackage = require.resolve('lighthouse/package.json')
const lighthouseRoot = dirname(lighthousePackage)
const { default: lighthouse } = await import(
	pathToFileURL(join(lighthouseRoot, 'core/index.js')).href
)
const { default: desktopConfig } = await import(
	pathToFileURL(join(lighthouseRoot, 'core/config/desktop-config.js')).href
)
const root = fileURLToPath(new URL('../', import.meta.url))
const reports = join(root, 'reports/lighthouse')
mkdirSync(reports, { recursive: true })
const server = spawn(
	process.execPath,
	[
		join(root, 'node_modules/vite/bin/vite.js'),
		'preview',
		'--host',
		'127.0.0.1',
		'--port',
		'4173',
		'--strictPort',
	],
	{ cwd: root, stdio: 'pipe', windowsHide: true },
)
let serverError = ''
server.stderr.on('data', (data) => {
	serverError += data.toString()
})
const port = await new Promise((resolve, reject) => {
	const socket = createServer()
	socket.once('error', reject)
	socket.listen(0, '127.0.0.1', () => {
		const port = socket.address().port
		socket.close(() => resolve(port))
	})
})
let browser
const summary = []
try {
	let ready = false
	for (let attempt = 0; attempt < 50; attempt++) {
		if (server.exitCode !== null) throw new Error(`Preview não iniciou: ${serverError}`)
		try {
			ready = (await fetch('http://127.0.0.1:4173/')).ok
		} catch {
			/* Wait for Vite. */
		}
		if (ready) break
		await new Promise((resolve) => setTimeout(resolve, 200))
	}
	if (!ready) throw new Error('O preview não ficou disponível em 10 segundos.')
	// Launch the installed headless Chromium through Playwright. This avoids relying
	// on a system Google Chrome installation or a separate chrome-launcher process.
	browser = await chromium.launch({ headless: true, args: [`--remote-debugging-port=${port}`] })
	writeFileSync(
		join(reports, 'environment.json'),
		JSON.stringify(
			{
				date: new Date().toISOString(),
				node: process.version,
				chromium: browser.version(),
				lighthouse: JSON.parse(readFileSync(lighthousePackage, 'utf8')).version,
				platform: process.platform,
				architecture: process.arch,
				os: os.release(),
				cpu: os.cpus()[0]?.model,
				logicalCpus: os.cpus().length,
				memoryGiB: Math.round(os.totalmem() / 1024 ** 3),
				conditions:
					'Build de produção; cenário padrão MSW; três medições por página/perfil; throttling simulado padrão do Lighthouse; sem simplificações exclusivas para auditoria.',
			},
			null,
			2,
		),
	)
	for (const profile of configuration.profiles) {
		const directory = join(reports, profile)
		mkdirSync(directory, { recursive: true })
		for (const [page, route] of configuration.pages) {
			const results = []
			for (let run = 1; run <= configuration.runs; run++) {
				console.log(`${profile} / ${page}: medição ${run}/3`)
				const result = await lighthouse(
					`http://127.0.0.1:4173${route}`,
					{ port, output: ['html', 'json'], logLevel: 'error', throttlingMethod: 'simulate' },
					profile === 'desktop' ? desktopConfig : undefined,
				)
				if (!result || result.lhr.runtimeError)
					throw new Error(
						result?.lhr.runtimeError?.message || 'Lighthouse não retornou um relatório.',
					)
				writeFileSync(join(directory, `${page}-${run}.html`), result.report[0])
				writeFileSync(join(directory, `${page}-${run}.json`), result.report[1])
				results.push(result.lhr)
			}
			const median = (values) => [...values].sort((a, b) => a - b)[1]
			const scores = Object.fromEntries(
				['performance', 'accessibility', 'best-practices', 'seo'].map((category) => [
					category,
					Math.round(median(results.map((result) => result.categories[category].score)) * 100),
				]),
			)
			const metrics = Object.fromEntries(
				['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map(
					(metric) => [metric, median(results.map((result) => result.audits[metric].numericValue))],
				),
			)
			summary.push({ profile, page, scores, metrics })
			console.log(`${profile}/${page}: ${JSON.stringify(scores)}`)
		}
	}
	writeFileSync(join(reports, 'summary.json'), JSON.stringify(summary, null, 2))
	const lines = [
		'# Lighthouse — medianas de três medições',
		'',
		'| Perfil | Página | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS | TBT (ms) |',
		'| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
		...summary.map(
			({ profile, page, scores, metrics }) =>
				`| ${profile} | ${page} | ${scores.performance} | ${scores.accessibility} | ${scores['best-practices']} | ${scores.seo} | ${Math.round(metrics['largest-contentful-paint'])} | ${metrics['cumulative-layout-shift'].toFixed(4)} | ${Math.round(metrics['total-blocking-time'])} |`,
		),
	]
	writeFileSync(join(reports, 'SUMMARY.md'), lines.join('\n') + '\n')
} finally {
	await browser?.close()
	server.kill()
}
