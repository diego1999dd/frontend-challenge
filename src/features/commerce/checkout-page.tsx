import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'
import { useSession } from '@/features/account/session-context'
import { useCart, useQuote, walletsOptions } from '@/features/account/queries'
import type { Collector, Network, Order, Quote } from '@/features/account/contracts'
import { AccountField, AccountSelect } from '@/components/account-field'
import { ApiError, FormSkeleton } from '@/components/api-feedback'
import { PageState } from '@/components/page-state'
import { Button } from '@/components/ui/button'
import { fieldClassName } from '@/components/ui/input'
import { http } from '@/lib/http'
import { CommerceHeader, QuoteTotals, ReceiptItems, CouponForm } from './components'
import { CollectorPanel } from './collector-panel'
import { useMobile } from '@/lib/use-mobile'
import { FormField } from '@/components/form-field'

const emptyCollector: Collector = {
	name: '',
	email: '',
	note: '',
}
function loadDraft(userId: string) {
	try {
		return JSON.parse(
			localStorage.getItem(`kurio-checkout:${userId}`) || 'null',
		) as Collector | null
	} catch {
		return null
	}
}
export function CheckoutPage() {
	const { user } = useSession()
	return user ? (
		<CheckoutForm
			key={user.id}
			userId={user.id}
			name={user.name}
			email={user.email}
			username={user.username}
		/>
	) : null
}
function CheckoutForm({
	userId,
	name,
	email,
	username,
}: {
	userId: string
	name: string
	email: string
	username: string
}) {
	const mobile = useMobile()
	const [collectorOpen, setCollectorOpen] = useState(false)
	const navigate = useNavigate()
	const cart = useCart()
	const wallets = useQuery(walletsOptions(userId))
	const [collector, setCollector] = useState<Collector>(
		() => loadDraft(userId) || { ...emptyCollector, name, email },
	)
	const [network, setNetwork] = useState<Network>('ethereum')
	const [walletId, setWalletId] = useState('')
	const wallet =
		wallets.data?.find((wallet) => wallet.id === walletId) ||
		wallets.data?.find((wallet) => wallet.network === network)
	const [connection, setConnection] = useState<'disconnected' | 'connected' | 'refused'>(
		'disconnected',
	)
	const [connectOpen, setConnectOpen] = useState(false)
	const [reviewOpen, setReviewOpen] = useState(false)
	const [reviewQuote, setReviewQuote] = useState<Quote | null>(null)
	const [error, setError] = useState<unknown>(null)
	const [pending, setPending] = useState(false)
	const quote = useQuote(network)
	const updateCollector = (field: keyof Collector, value: string) =>
		setCollector((previous) => {
			const updated = { ...previous, [field]: value }
			localStorage.setItem(`kurio-checkout:${userId}`, JSON.stringify(updated))
			return updated
		})
	const field = (label: string, key: keyof Collector, type = 'text') => (
		<AccountField
			label={label}
			type={type}
			name={key}
			value={collector[key]}
			onChange={(event) => updateCollector(key, event.target.value)}
			required
		/>
	)
	async function recover(key: string) {
		const orders = (await http.get<Order[]>('/orders', { params: { key } })).data
		if (orders[0]) {
			await navigate({ to: '/pedidos/$orderId', params: { orderId: orders[0].id } })
			return true
		}
		return false
	}
	async function purchase() {
		if (pending || !reviewQuote || !wallet) return
		setPending(true)
		setError(null)
		const attemptKey = `kurio-attempt:${userId}`
		try {
			const previous = localStorage.getItem(attemptKey)
			if (previous && (await recover(previous))) return
			const key = previous || crypto.randomUUID()
			localStorage.setItem(attemptKey, key)
			try {
				const order = (
					await http.post<Order>(
						'/orders',
						{
							quoteId: reviewQuote.id,
							walletId: wallet.id,
							collector,
							connected: connection === 'connected',
						},
						{ headers: { 'Idempotency-Key': key } },
					)
				).data
				await navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
			} catch (error) {
				if (await recover(key)) return
				// No order was created: a changed quote requires a new reviewed attempt.
				localStorage.removeItem(attemptKey)
				throw error
			}
		} catch (error) {
			setError(error)
			setReviewOpen(false)
			void quote.refetch()
		} finally {
			setPending(false)
		}
	}
	if (cart.isPending || wallets.isPending) return <FormSkeleton />
	if (cart.isError || wallets.isError)
		return (
			<ApiError
				error={cart.error || wallets.error}
				retry={() => {
					void cart.refetch()
					void wallets.refetch()
				}}
			/>
		)
	if (!cart.data.items.length)
		return (
			<PageState
				title="Seu carrinho está vazio"
				description="Adicione um NFT antes de iniciar o pagamento."
				action={
					<Button asChild>
						<Link to="/">Explorar NFTs</Link>
					</Button>
				}
			/>
		)
	return (
		<section className="checkout-page">
			<CommerceHeader title="Pagamento com carteira" />
			<div className="checkout-body">
				<CollectorPanel open={collectorOpen} onOpenChange={setCollectorOpen}>
					<form
						id="collector-form"
						className="checkout-collector"
						onSubmit={(event) => {
							event.preventDefault()
							setError(null)
							setCollectorOpen(false)
							setReviewQuote(quote.data || null)
							setReviewOpen(true)
						}}
					>
						<h1>Perfil do colecionador</h1>
						<div className="account-fields">
							{field('Nome de exibição', 'name')}
							<AccountField label="Nome de usuário" value={username} readOnly />
							<AccountSelect
								label="Rede"
								value={network}
								onChange={(event) => {
									setNetwork(event.target.value as Network)
									setConnection('disconnected')
									setWalletId('')
									setReviewOpen(false)
								}}
							>
								{(['ethereum', 'polygon', 'solana'] as const).map((network) => (
									<option value={network} key={network}>
										{network.charAt(0).toUpperCase() + network.slice(1)}
									</option>
								))}
							</AccountSelect>
							<AccountField label="Nome do perfil" value={wallet?.profileName || ''} readOnly />
							<AccountField label="Endereço da carteira" value={wallet?.address || ''} readOnly />
							<AccountField
								label="ENS ou carteira secundária"
								value={wallets.data.find((other) => other.id !== wallet?.id)?.address || ''}
								readOnly
							/>
							<AccountField label="Tipo de carteira" value={wallet?.provider || ''} readOnly />
							<AccountField label="Código de indicação" value={wallet?.referral || ''} readOnly />
							{field('E-mail', 'email', 'email')}
							<AccountField label="Nome ENS" value={wallet?.ens || ''} readOnly />
						</div>
						<FormField label="Observação do colecionador (opcional)" className="collector-note">
							{(props) => (
								<textarea
									{...props}
									className={fieldClassName}
									name="note"
									value={collector.note}
									maxLength={500}
									onChange={(event) => updateCollector('note', event.target.value)}
								/>
							)}
						</FormField>
						{mobile && <Button type="submit">Continuar para revisão</Button>}
					</form>
				</CollectorPanel>
				<aside className="checkout-summary">
					<h2>Seus NFTs</h2>
					<ReceiptItems items={cart.data.items} />
					<CouponForm coupon={cart.data.coupon} />
					{quote.isPending ? (
						<FormSkeleton />
					) : quote.isError ? (
						<ApiError error={quote.error} retry={() => void quote.refetch()} />
					) : (
						<QuoteTotals quote={quote.data} />
					)}
					<section className="wallet-picker">
						<h2>
							{mobile
								? connection === 'connected'
									? 'Carteira conectada'
									: 'Selecione uma carteira'
								: 'Carteira e rede'}
						</h2>
						{wallets.data.length ? (
							wallets.data.map((item) => (
								<label key={item.id} className={wallet?.id === item.id ? 'is-selected' : ''}>
									<input
										type="radio"
										name="wallet"
										checked={wallet?.id === item.id}
										onChange={() => {
											setWalletId(item.id)
											setNetwork(item.network)
											setConnection('disconnected')
											setReviewOpen(false)
										}}
									/>
									<div>
										<strong>{item.alias}</strong>
										<span>
											{item.address.slice(0, 8)}…{item.address.slice(-4)}
										</span>
										<span>
											Rede {item.network} · {item.provider}
										</span>
									</div>
								</label>
							))
						) : (
							<p>
								Cadastre uma carteira para continuar.{' '}
								<Link to="/carteiras">Adicionar carteira</Link>
							</p>
						)}
						{mobile && (
							<div className="connection-providers">
								<h2>Carteira e rede</h2>
								{['WalletConnect', 'MetaMask', 'Coinbase'].map((provider) => (
									<button
										type="button"
										key={provider}
										aria-label={`Conectar com ${provider}`}
										id={`connect-provider-${provider}`}
										aria-pressed={wallet?.provider === provider && connection === 'connected'}
										disabled={!wallets.data.some((item) => item.provider === provider)}
										onClick={() => {
											const item = wallets.data.find((item) => item.provider === provider)!
											setWalletId(item.id)
											setNetwork(item.network)
											setConnectOpen(true)
										}}
									>
										<span aria-hidden="true">{provider.charAt(0)}</span>
										{provider}
										<i aria-hidden="true" />
									</button>
								))}
							</div>
						)}
						<p role="status">
							{connection === 'connected'
								? 'Carteira conectada na simulação'
								: connection === 'refused'
									? 'Conexão recusada. Tente novamente.'
									: 'Carteira desconectada'}
						</p>
						<Dialog.Root open={connectOpen} onOpenChange={setConnectOpen}>
							<Dialog.Trigger asChild>
								<Button
									type="button"
									variant="outline"
									disabled={!wallet}
									className="connect-wallet-button"
								>
									{connection === 'connected' ? 'Gerenciar conexão' : 'Conectar carteira'}
								</Button>
							</Dialog.Trigger>
							<Dialog.Portal>
								<Dialog.Overlay className="flow-overlay" />
								<Dialog.Content
									className="flow-dialog"
									onCloseAutoFocus={(event) => {
										if (mobile && wallet) {
											event.preventDefault()
											document.getElementById(`connect-provider-${wallet.provider}`)?.focus()
										}
									}}
								>
									<Dialog.Title>Conexão de carteira simulada</Dialog.Title>
									<Dialog.Description>
										Nenhuma extensão ou transação real será solicitada.
									</Dialog.Description>
									<div className="flex flex-wrap gap-3">
										<Button
											type="button"
											onClick={() => {
												setConnection('connected')
												setConnectOpen(false)
											}}
										>
											Autorizar conexão
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setConnection('refused')
												setConnectOpen(false)
											}}
										>
											Recusar conexão
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setConnection('disconnected')
												setConnectOpen(false)
												setReviewOpen(false)
											}}
										>
											Desconectar
										</Button>
									</div>
									<Dialog.Close aria-label="Fechar conexão">Fechar</Dialog.Close>
								</Dialog.Content>
							</Dialog.Portal>
						</Dialog.Root>
					</section>
					<ApiError error={error} />
					<Button
						type={mobile ? 'button' : 'submit'}
						form={mobile ? undefined : 'collector-form'}
						onClick={() => {
							if (!mobile) return
							if (!collector.name.trim() || !/^\S+@\S+\.\S+$/.test(collector.email)) {
								setCollectorOpen(true)
								return
							}
							setReviewQuote(quote.data || null)
							setReviewOpen(true)
						}}
						className="confirm-purchase"
						disabled={
							pending ||
							connection !== 'connected' ||
							!quote.data ||
							quote.isFetching ||
							quote.isError
						}
					>
						Revisar compra
					</Button>
					<p className="simulation-note">Pagamento simulado. Não envie criptomoedas reais.</p>
				</aside>
			</div>
			<Dialog.Root open={reviewOpen} onOpenChange={setReviewOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className="flow-overlay" />
					<Dialog.Content
						className="flow-dialog purchase-review"
						onCloseAutoFocus={(event) => {
							const trigger = document.querySelector<HTMLButtonElement>('.confirm-purchase')
							if (trigger) {
								event.preventDefault()
								trigger.focus()
							}
						}}
					>
						<Dialog.Title>Revisar e confirmar compra</Dialog.Title>
						<Dialog.Description>
							Confira os itens, a carteira e os valores antes de enviar o pedido simulado.
						</Dialog.Description>
						{reviewQuote && (
							<>
								<ReceiptItems items={reviewQuote.items} />
								<QuoteTotals quote={reviewQuote} />
								<p>
									Recebedor: {collector.name} · {collector.email}
								</p>
								<p className="break-all">Carteira: {wallet?.address}</p>
								{reviewQuote.id !== quote.data?.id && (
									<p role="alert">A cotação foi atualizada. Volte e revise os valores novamente.</p>
								)}
								<Button
									disabled={
										pending ||
										quote.isFetching ||
										reviewQuote.id !== quote.data?.id ||
										connection !== 'connected'
									}
									onClick={() => void purchase()}
								>
									{pending ? 'Enviando pedido…' : 'Confirmar compra'}
								</Button>
							</>
						)}
						<Dialog.Close disabled={pending}>Voltar à revisão</Dialog.Close>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</section>
	)
}
