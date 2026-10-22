import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { FormField } from '@/components/form-field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/components/api-feedback'
import { NftArtwork } from '@/components/nft/nft-artwork'
import { http } from '@/lib/http'
import { useSession } from '@/features/account/session-context'
import { cartKey } from '@/features/account/queries'
import type { CartItem, Quote } from '@/features/account/contracts'

export function CommerceHeader({ title }: { title: string }) {
	return (
		<>
			<nav className="commerce-breadcrumb" aria-label="Caminho da página">
				<Link to="/">Início</Link> / <Link to="/">Mercado</Link> / {title}
			</nav>
			<div className="commerce-mobile-heading">
				<Link
					to={title === 'Pagamento com carteira' ? '/carrinho' : '/'}
					aria-label={
						title === 'Pagamento com carteira' ? 'Voltar ao carrinho' : 'Voltar ao catálogo'
					}
				>
					<ChevronLeft size={20} />
				</Link>
				<h1>{title}</h1>
			</div>
		</>
	)
}
export function QuoteTotals({ quote }: { quote: Quote }) {
	return (
		<dl className="quote-totals">
			<div>
				<dt>Subtotal</dt>
				<dd>{quote.subtotal} ETH</dd>
			</div>
			<div>
				<dt>Desconto do lançamento</dt>
				<dd>(−) {quote.discount} ETH</dd>
			</div>
			<div>
				<dt>Taxa de rede</dt>
				<dd>{quote.fee} ETH</dd>
			</div>
			<p className="quote-estimate">Taxa estimada · simulação</p>
			<div className="quote-total">
				<dt>Total</dt>
				<dd>{quote.total} ETH</dd>
			</div>
		</dl>
	)
}
export function CouponForm({ coupon }: { coupon: string }) {
	const client = useQueryClient()
	const { user } = useSession()
	const mutation = useMutation({
		mutationFn: async (code: string) => (await http.put('/cart/coupon', { code })).data,
		onSuccess: () => {
			void client.invalidateQueries({ queryKey: cartKey(user?.id) })
			void client.invalidateQueries({ queryKey: ['quote'] })
		},
	})
	return (
		<form
			className="coupon-form"
			onSubmit={(event) => {
				event.preventDefault()
				mutation.mutate(String(new FormData(event.currentTarget).get('coupon') || ''))
			}}
		>
			<FormField label="Código promocional">
				{(props) => (
					<div>
						<Input
							{...props}
							name="coupon"
							placeholder="Digite o código promocional..."
							defaultValue={coupon}
							key={coupon}
						/>
						<Button disabled={mutation.isPending}>Aplicar</Button>
					</div>
				)}
			</FormField>
			{coupon && (
				<button type="button" onClick={() => mutation.mutate('')} disabled={mutation.isPending}>
					Remover cupom {coupon}
				</button>
			)}
			<ApiError error={mutation.error} />
			{mutation.isSuccess && <p role="status">Cupom atualizado.</p>}
		</form>
	)
}
export function ReceiptItems({ items }: { items: CartItem[] }) {
	return (
		<div className="receipt-items">
			{items.map((item) => (
				<div className="receipt-item" key={item.id}>
					<NftArtwork nft={item.nft} />
					<div>
						<h3>{item.nft.name}</h3>
						<p>ID do token: #{item.nft.tokenId}</p>
						<span>Edição: {item.edition}</span>
					</div>
					<span>(x {item.quantity})</span>
					<strong>{item.total} ETH</strong>
				</div>
			))}
		</div>
	)
}
