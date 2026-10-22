import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			gcTime: 5 * 60_000,
			retry: (failureCount, error) => {
				if (isAxiosError(error) && error.response && error.response.status < 500) return false
				return failureCount < 1
			},
			refetchOnWindowFocus: true,
		},
		mutations: { retry: false },
	},
})
