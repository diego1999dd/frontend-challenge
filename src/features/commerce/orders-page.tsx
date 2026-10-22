import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { useSession } from '@/features/account/session-context'
import { ordersOptions, orderOptions } from '@/features/account/queries'
import { AccountLayout } from '@/features/account/account-layout'
import { ApiError, FormSkeleton } from '@/components/api-feedback'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/page-state'
import { useNotice } from '@/components/notice-provider'
import { QuoteTotals, ReceiptItems } from './components'

export function OrdersPage() {
	const { user } = useSession()
	const query = useQuery(ordersOptions(user?.id))
	return (
		<AccountLayout active="Meus pedidos">
			<h1 className="mb-8 font-bold">Meus pedidos</h1>
			{query.isPending ? (
				<FormSkeleton />
			) : query.isError ? (
				<ApiError error={query.error} retry={() => void query.refetch()} />
			) : !query.data.length ? (
				<PageState
					title="Você ainda não tem pedidos"
					description="Seus pedidos simulados aparecerão aqui."
				/>
			) : (
				<div className="orders-list">
					{[...query.data].reverse().map((order) => (
						<Link key={order.id} to="/pedidos/$orderId" params={{ orderId: order.id }}>
							<strong>Pedido #{order.id.slice(0, 8)}</strong>
							<span>
								{order.status === 'confirmed'
									? 'Confirmado'
									: order.status === 'pending'
										? 'Pendente'
										: 'Recusado'}
							</span>
							<span>{order.quote.total} ETH</span>
						</Link>
					))}
				</div>
			)}
		</AccountLayout>
	)
}
export function OrderPage() {
	const { orderId } = useParams({ from: '/pedidos/$orderId' })
	const { user } = useSession()
	const query = useQuery(orderOptions(user?.id, orderId))
	const order = query.data
	const notice = useNotice()
	useEffect(() => {
		if (!user || !order || order.status === 'pending') return
		const key = `kurio-attempt:${user.id}`
		if (localStorage.getItem(key) === order.key) localStorage.removeItem(key)
	}, [order, user])
	if (query.isPending) return <FormSkeleton />
	if (query.isError) return <ApiError error={query.error} retry={() => void query.refetch()} />
	if (!order) return null
	if (order.status !== 'confirmed')
		return (
			<section className="order-state" aria-live="polite">
				<h1>{order.status === 'pending' ? 'Pedido pendente' : 'Pagamento recusado'}</h1>
				<p>{order.message}</p>
				<p>Pedido #{order.id}</p>
				{order.status === 'pending' ? (
					<>
						<p>Você pode recarregar ou retornar depois. A mesma compra será recuperada.</p>
						<Button onClick={() => void query.refetch()}>Consultar pedido</Button>
					</>
				) : (
					<Button asChild>
						<Link to="/carrinho">Voltar ao carrinho</Link>
					</Button>
				)}
			</section>
		)
	return (
		<section className="order-receipt" aria-label="Recibo do pedido">
			<header>
				<img src="/images/icons/11-5150.svg" alt="" aria-hidden="true" />
				<h1>Seus NFTs agora estão na sua carteira</h1>
				<p>Compra confirmada na simulação</p>
			</header>
			<dl className="receipt-meta">
				<div>
					<dt>ID da transação</dt>
					<dd title={order.transaction}>
						{order.transaction.slice(0, 8)}…{order.transaction.slice(-4)}
					</dd>
				</div>
				<div>
					<dt>Data</dt>
					<dd>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</dd>
				</div>
				<div>
					<dt>Total</dt>
					<dd>{order.quote.total} ETH</dd>
				</div>
				<div>
					<dt>Carteira</dt>
					<dd>{order.wallet.provider}</dd>
				</div>
			</dl>
			<div className="receipt-details">
				<h2>Detalhes da transação</h2>
				<ReceiptItems items={order.quote.items} />
				<QuoteTotals quote={order.quote} />
				<p>
					Transação simulada confirmada na rede {order.wallet.network}. Nenhum ativo real foi
					transferido.
				</p>
				<Button
					onClick={() =>
						notice(
							'Explorador simulado',
							`Referência fictícia: ${order.transaction}. Esta transação não existe em uma blockchain real.`,
						)
					}
				>
					Ver transação simulada
				</Button>
				<Link to="/pedidos">Ver meus pedidos</Link>
			</div>
		</section>
	)
}
