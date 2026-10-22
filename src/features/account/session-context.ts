import { createContext, useContext } from 'react'
import type { Profile } from './contracts'

export interface SessionContextValue {
	user: Profile | null
	loading: boolean
	expired: boolean
	login: (data: { email: string; password: string }) => Promise<void>
	register: (data: Record<string, string>) => Promise<void>
	logout: () => Promise<void>
}
export const SessionContext = createContext<SessionContextValue | null>(null)
export function useSession() {
	const context = useContext(SessionContext)
	if (!context) throw new Error('SessionProvider não encontrado')
	return context
}
