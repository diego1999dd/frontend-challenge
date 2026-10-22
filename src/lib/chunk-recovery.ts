// A previous tab may request a lazy chunk removed by a new deployment. Recover
// once with fresh HTML; repeated failures stay visible instead of a reload loop.
export function recoverStaleChunk() {
	const key = 'kurio-chunk-recovery'
	window.addEventListener('vite:preloadError', (event) => {
		try {
			const last = Number(sessionStorage.getItem(key) || 0)
			if (Date.now() - last < 60_000) return
			sessionStorage.setItem(key, String(Date.now()))
			event.preventDefault()
			location.reload()
		} catch {
			// Storage may be unavailable. The normal route error remains recoverable.
		}
	})
}
