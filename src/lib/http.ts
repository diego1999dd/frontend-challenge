import axios from 'axios'

export const http = axios.create({
	baseURL: import.meta.env.VITE_API_URL || '/api',
	timeout: 10_000,
})

http.interceptors.request.use((config) => {
	const token = localStorage.getItem('kurio-demo-session')
	let visitor = localStorage.getItem('kurio-demo-visitor')
	if (!visitor) {
		visitor = crypto.randomUUID()
		localStorage.setItem('kurio-demo-visitor', visitor)
	}
	if (token) config.headers.set('Authorization', `Bearer ${token}`)
	config.headers.set('X-Visitor-Id', visitor)
	return config
})
http.interceptors.response.use(
	(response) => response,
	(error) => {
		if (
			axios.isAxiosError(error) &&
			error.response?.status === 401 &&
			error.response.data?.code === 'SESSION_EXPIRED'
		) {
			const sent = error.config?.headers?.Authorization
			if (sent === `Bearer ${localStorage.getItem('kurio-demo-session')}`) {
				localStorage.removeItem('kurio-demo-session')
				window.dispatchEvent(new Event('kurio:session-expired'))
			}
		}
		return Promise.reject(error)
	},
)
