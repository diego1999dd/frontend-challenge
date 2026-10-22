// Prioritize the first visible artwork over the optional event-client download.
// This is bounded and cancellable: broken/slow images never prevent realtime,
// and the connection's REST reconciliation recovers changes during startup.
export function afterArtworkPaint(callback: () => void) {
	let cancelled = false
	let ready = false
	let frame = 0
	let timeout = 0
	let image: HTMLImageElement | null = null
	const cleanupImage = () => {
		window.clearTimeout(timeout)
		image?.removeEventListener('load', paint)
		image?.removeEventListener('error', paint)
	}
	const paint = () => {
		if (cancelled || ready) return
		ready = true
		cleanupImage()
		// Let the decoded artwork reach a frame before parsing the socket client.
		frame = requestAnimationFrame(() => {
			frame = requestAnimationFrame(() => {
				if (!cancelled) callback()
			})
		})
	}
	// Query-cache notifications can precede React's commit of the actual image.
	frame = requestAnimationFrame(() => {
		image = document.querySelector('.detail-main-image img, .home-hero__art > img')
		if (!image || image.complete) {
			paint()
			return
		}
		image.addEventListener('load', paint, { once: true })
		image.addEventListener('error', paint, { once: true })
		timeout = window.setTimeout(paint, 1000)
	})
	return () => {
		cancelled = true
		cancelAnimationFrame(frame)
		cleanupImage()
	}
}
