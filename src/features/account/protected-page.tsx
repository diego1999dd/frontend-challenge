import { Navigate, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { FormSkeleton } from '@/components/api-feedback'
import { useSession } from './session-context'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from './contracts'

export function ProtectedPage({ children }: { children: ReactNode }) {
	const { loading } = useSession()
	const client = useQueryClient()
	// Navigation may commit before the provider's batched observer notification.
	// The synchronously updated session cache is authoritative during that boundary.
	const authenticated = client.getQueryData<Session>(['session'])?.user
	const href = useRouterState({ select: (state) => state.location.href })
	const [returnTo] = useState(href)
	if (loading && !authenticated) return <FormSkeleton />
	if (!authenticated) return <Navigate to="/login" search={{ redirect: returnTo }} replace />
	return children
}
