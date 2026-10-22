import { useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/http'
import type { Session } from './contracts'
import { SessionContext } from './session-context'

const sensitiveQuery = (query: { queryKey: readonly unknown[] }) =>
	['private', 'quote', 'cart'].includes(String(query.queryKey[0]))

export function SessionProvider({ children }: { children: ReactNode }) {
	const client = useQueryClient()
	const [expired, setExpired] = useState(false)
	const query = useQuery({
		queryKey: ['session'],
		queryFn: async ({ signal }) => (await http.get<Session>('/session', { signal })).data,
		retry: false,
		staleTime: 15_000,
	})
	useEffect(() => {
		const clear = () => {
			void client.cancelQueries({ queryKey: ['session'] })
			void client.cancelQueries({ predicate: sensitiveQuery })
			client.removeQueries({ predicate: sensitiveQuery })
			client.setQueryData(['session'], { user: null })
			setExpired(true)
		}
		const storage = (event: StorageEvent) => {
			if (event.key === 'kurio-demo-session') {
				clear()
				void client.invalidateQueries({ queryKey: ['session'] })
			}
		}
		window.addEventListener('kurio:session-expired', clear)
		window.addEventListener('storage', storage)
		return () => {
			window.removeEventListener('kurio:session-expired', clear)
			window.removeEventListener('storage', storage)
		}
	}, [client])
	useEffect(() => {
		if (!query.data?.expiresAt) return
		const timer = setTimeout(
			() => {
				localStorage.removeItem('kurio-demo-session')
				window.dispatchEvent(new Event('kurio:session-expired'))
				void client.invalidateQueries({ queryKey: ['session'] })
			},
			Math.max(0, query.data.expiresAt - Date.now()) + 10,
		)
		return () => clearTimeout(timer)
	}, [client, query.data?.expiresAt])
	const authenticate = async (path: string, data: unknown) => {
		await client.cancelQueries({ queryKey: ['session'] })
		const response = (await http.post<Session & { token: string }>(path, data)).data
		await client.cancelQueries({
			predicate: sensitiveQuery,
		})
		client.removeQueries({
			predicate: sensitiveQuery,
		})
		localStorage.setItem('kurio-demo-session', response.token)
		client.setQueryData(['session'], { user: response.user, expiresAt: response.expiresAt })
		setExpired(false)
	}
	return (
		<SessionContext.Provider
			value={{
				user: query.data?.user ?? null,
				loading: query.isPending,
				expired,
				login: (data) => authenticate('/session', data),
				register: (data) => authenticate('/accounts', data),
				logout: async () => {
					try {
						await http.delete('/session')
					} catch {
						// Local logout must still clear private state when the mock network is offline.
					} finally {
						localStorage.removeItem('kurio-demo-session')
						await client.cancelQueries({ queryKey: ['session'] })
						await client.cancelQueries({ predicate: sensitiveQuery })
						client.removeQueries({ predicate: sensitiveQuery })
						client.setQueryData(['session'], { user: null })
						setExpired(false)
					}
				},
			}}
		>
			{children}
		</SessionContext.Provider>
	)
}
