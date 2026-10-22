import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useNavigate } from '@tanstack/react-router'
import { http } from '@/lib/http'
import { useSession } from './session-context'
import type { Cart, Network, Order, Profile, Quote, Wallet } from './contracts'

export const privateKey = (userId: string | undefined, resource: string) =>
	['private', userId, resource] as const
export const cartKey = (userId: string | undefined) =>
	userId ? privateKey(userId, 'cart') : (['cart', 'guest'] as const)
export function useCart() {
	const { user, loading } = useSession()
	return useQuery({
		queryKey: cartKey(user?.id),
		queryFn: async ({ signal }) => (await http.get<Cart>('/cart', { signal })).data,
		enabled: !loading,
	})
}
export function useCartMutation() {
	const client = useQueryClient()
	const { user } = useSession()
	return useMutation({
		mutationFn: async ({
			method,
			path,
			body,
		}: {
			method: 'post' | 'put' | 'delete'
			path: string
			body?: unknown
		}) => (await http.request<Cart>({ method, url: path, data: body })).data,
		onSuccess: () => {
			void client.invalidateQueries({ queryKey: cartKey(user?.id) })
			void client.invalidateQueries({ queryKey: ['quote'] })
		},
	})
}
export function useFavorites() {
	const { user } = useSession()
	return useQuery({
		queryKey: privateKey(user?.id, 'favorites'),
		queryFn: async ({ signal }) => (await http.get<string[]>('/favorites', { signal })).data,
		enabled: !!user,
	})
}
export function useFavorite(nftId: string) {
	const { user } = useSession()
	const favorites = useFavorites()
	const client = useQueryClient()
	const navigate = useNavigate()
	const key = privateKey(user?.id, 'favorites')
	const mutation = useMutation({
		mutationFn: async (remove: boolean) =>
			(
				await http.request<string[]>({
					method: remove ? 'delete' : 'put',
					url: `/favorites/${encodeURIComponent(nftId)}`,
				})
			).data,
		onMutate: async (remove: boolean) => {
			const token = localStorage.getItem('kurio-demo-session')
			await client.cancelQueries({ queryKey: key })
			const previous = client.getQueryData<string[]>(key) ?? []
			if (token === localStorage.getItem('kurio-demo-session'))
				client.setQueryData(
					key,
					remove ? previous.filter((id) => id !== nftId) : [...new Set([...previous, nftId])],
				)
			return { previous, token }
		},
		onError: (_, __, context) => {
			if (context && context.token === localStorage.getItem('kurio-demo-session'))
				client.setQueryData(key, context.previous)
		},
		onSettled: () => {
			void client.invalidateQueries({ queryKey: key })
		},
	})
	const selected = favorites.data?.includes(nftId) ?? false
	return {
		selected,
		pending: mutation.isPending,
		error: mutation.error,
		toggle: () => {
			if (!user) {
				void navigate({ to: '/login', search: { redirect: location.pathname + location.search } })
				return
			}
			if (!mutation.isPending) mutation.mutate(selected)
		},
	}
}
export function walletsOptions(userId?: string) {
	return queryOptions({
		queryKey: privateKey(userId, 'wallets'),
		queryFn: async ({ signal }) => (await http.get<Wallet[]>('/wallets', { signal })).data,
		enabled: !!userId,
	})
}
export function profileOptions(userId?: string) {
	return queryOptions({
		queryKey: privateKey(userId, 'profile'),
		queryFn: async ({ signal }) => (await http.get<Profile>('/profile', { signal })).data,
		enabled: !!userId,
	})
}
export function useQuote(network: Network = 'ethereum') {
	const { user, loading } = useSession()
	const cart = useCart()
	return useQuery({
		queryKey: ['quote', user?.id ?? 'guest', cart.data?.revision, network],
		queryFn: async ({ signal }) =>
			(await http.post<Quote>('/quotes', { network }, { signal })).data,
		enabled: !loading && !!cart.data,
		staleTime: 15_000,
		retry: false,
	})
}
export function ordersOptions(userId?: string) {
	return queryOptions({
		queryKey: privateKey(userId, 'orders'),
		queryFn: async ({ signal }) => (await http.get<Order[]>('/orders', { signal })).data,
		enabled: !!userId,
	})
}
export function orderOptions(userId: string | undefined, id: string) {
	return queryOptions({
		queryKey: [...privateKey(userId, 'orders'), id],
		queryFn: async ({ signal }) =>
			(await http.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })).data,
		enabled: !!userId,
		refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
	})
}
export function apiError(error: unknown): string {
	if (isAxiosError(error))
		return (
			error.response?.data?.message ||
			(error.code === 'ECONNABORTED'
				? 'A resposta demorou. Consulte o pedido antes de tentar outra compra.'
				: 'Falha de conexão. Verifique a rede e tente novamente.')
		)
	return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}
export function apiFields(error: unknown): Record<string, string> {
	return isAxiosError(error) ? (error.response?.data?.fields ?? {}) : {}
}
