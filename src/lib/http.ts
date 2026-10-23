import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

type RecoverableRequest = InternalAxiosRequestConfig & {
	apiRecoveryAttempt?: boolean
	apiGeneration?: number
}

let recoverTransport: (() => Promise<void>) | undefined
let recovering: Promise<void> | undefined
let transportGeneration = 0

// Configured only by the mock bootstrap. No fixtures or business responses live here.
export function registerApiRecovery(recover: () => Promise<void>) {
	recoverTransport = recover
}

export const http = axios.create({
	baseURL: import.meta.env.VITE_API_URL || '/api',
	timeout: 10_000,
})

http.interceptors.request.use(async (config: RecoverableRequest) => {
	await recovering
	config.apiGeneration = transportGeneration
	config.headers.set('Accept', 'application/json')
	const token = localStorage.getItem('kurio-demo-session')
	let visitor = localStorage.getItem('kurio-demo-visitor')
	if (!visitor) {
		visitor = crypto.randomUUID()
		localStorage.setItem('kurio-demo-visitor', visitor)
	}
	if (token) config.headers.set('Authorization', `Bearer ${token}`)
	else config.headers.delete('Authorization')
	config.headers.set('X-Visitor-Id', visitor)
	return config
})

function isJsonResponse(response: AxiosResponse) {
	return (
		response.status === 204 ||
		(String(response.headers['content-type'] || '')
			.toLowerCase()
			.includes('json') &&
			typeof response.data === 'object' &&
			response.data !== null)
	)
}

async function invalidApiResponse(response: AxiosResponse) {
	const config = response.config as RecoverableRequest
	const invalid = () =>
		new AxiosError(
			'A API não retornou JSON válido. Tente novamente para recuperar a conexão.',
			'ERR_INVALID_API_RESPONSE',
			config,
			response.request,
		)
	// Never replay a mutation automatically: it may already have been processed.
	if (recoverTransport && !config.apiRecoveryAttempt) {
		try {
			if (config.apiGeneration === transportGeneration) {
				recovering ??= recoverTransport()
					.then(() => {
						transportGeneration += 1
					})
					.finally(() => {
						recovering = undefined
					})
				await recovering
			}
			if (['get', 'head', 'options'].includes(config.method || 'get')) {
				return http.request({ ...config, apiRecoveryAttempt: true } as RecoverableRequest)
			}
		} catch {
			throw invalid()
		}
	}
	throw invalid()
}

http.interceptors.response.use(
	(response) => (isJsonResponse(response) ? response : invalidApiResponse(response)),
	(error) => {
		if (axios.isAxiosError(error) && error.response && !isJsonResponse(error.response))
			return invalidApiResponse(error.response)
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
