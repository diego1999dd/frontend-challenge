import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/http'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/components/api-feedback'

export function DemoPage() {
	const client = useQueryClient()
	const query = useQuery({
		queryKey: ['demo-scenario'],
		queryFn: async () => (await http.get<{ scenario: string }>('/demo/scenario')).data,
	})
	const mutation = useMutation({
		mutationFn: async (scenario: string) => (await http.post('/demo/scenario', { scenario })).data,
		onSuccess: () => {
			void client.invalidateQueries()
		},
	})
	return (
		<section className="demo-page">
			<h1>Cenários da demonstração</h1>
			<p>
				Dados fictícios e estado persistido apenas neste navegador. Cenário atual:{' '}
				{query.data?.scenario || 'carregando'}
			</p>
			<label>
				Cenário de rede e negócio
				<select
					className="w-full border border-input bg-surface p-3"
					value={query.data?.scenario || 'normal'}
					onChange={(event) => mutation.mutate(event.target.value)}
					disabled={mutation.isPending}
				>
					{[
						['normal', 'Normal'],
						['slow', 'Carregamento lento'],
						['out-of-order', 'Respostas fora de ordem'],
						['payment-pending', 'Pedido pendente por 60 segundos'],
						['offline', 'Falha de conexão'],
						['http-error', 'HTTP 503'],
						['favorite-failure', 'Falha de favorito / rollback'],
						['coupon-expired', 'Cupom expirado'],
						['price-changed', 'Preço alterado ao confirmar'],
						['payment-declined', 'Pagamento recusado'],
						['order-timeout', 'Timeout após criar pedido'],
					].map(([value, label]) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
			</label>
			<Button onClick={() => void http.post('/demo/expire').then(() => client.invalidateQueries())}>
				Expirar sessão
			</Button>
			<Button
				variant="outline"
				onClick={async () => {
					if (
						!window.confirm(
							'Restaurar os dados fictícios deste navegador? Contas e pedidos de demonstração serão apagados.',
						)
					)
						return
					await http.post('/demo/reset')
					location.assign('/')
				}}
			>
				Restaurar cenário inicial
			</Button>
			<ApiError error={mutation.error} />
			<p>Credenciais: ana@kurio.test ou bruno@kurio.test · senha Demo123!</p>
		</section>
	)
}
