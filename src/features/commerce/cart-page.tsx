import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useCart, useCartMutation, useQuote } from '@/features/account/queries'
import { ApiError, FormSkeleton } from '@/components/api-feedback'
import { Button } from '@/components/ui/button'
import { QuantitySelector } from '@/components/quantity-selector'
import { NftArtwork } from '@/components/nft/nft-artwork'
import { PageState } from '@/components/page-state'
import { RelatedNfts } from '@/features/catalog/components/nft-detail'
import { CommerceHeader, CouponForm, QuoteTotals } from './components'

export function CartPage() {
	const cart = useCart()
	const quote = useQuote()
	const mutation = useCartMutation()
	return (
		<div className="cart-page">
			<section className="cart-top">
				<CommerceHeader title="Carrinho de NFTs" />
				{cart.isPending ? (
					<FormSkeleton />
				) : cart.isError ? (
					<ApiError error={cart.error} retry={() => void cart.refetch()} />
				) : !cart.data.items.length ? (
					<PageState
						title="Seu carrinho está vazio"
						description="Explore as coleções e escolha seu próximo NFT."
						action={
							<Button asChild>
								<Link to="/">Continuar explorando</Link>
							</Button>
						}
					/>
				) : (
					<div className="cart-body">
						<div className="cart-table">
							<div className="cart-table-heading" aria-hidden="true">
								<span>NFTs</span>
								<span>Preço</span>
								<span>Edições</span>
								<span>Total</span>
								<span />
							</div>
							<div className="cart-items">
								{cart.data.items.map((item) => (
									<article
										className="cart-item"
										key={item.id}
										aria-label={`${item.nft.name}, edição ${item.edition}`}
									>
										<Link
											className="cart-item-product"
											to="/nfts/$nftId"
											params={{ nftId: item.nftId }}
										>
											<NftArtwork nft={item.nft} />
											<div>
												<h2>{item.nft.name}</h2>
												<p>ID do token: #{item.nft.tokenId}</p>
												<span>Edição: {item.edition}</span>
											</div>
										</Link>
										<span className="cart-item-price">{item.nft.price} ETH</span>
										<div className="cart-item-quantity">
											<QuantitySelector
												value={item.quantity}
												max={item.available}
												onChange={(quantity) => {
													if (!mutation.isPending)
														mutation.mutate({
															method: 'put',
															path: `/cart/items/${encodeURIComponent(item.id)}`,
															body: { quantity },
														})
												}}
											/>
										</div>
										<strong className="cart-item-total">{item.total} ETH</strong>
										<button
											className="cart-item-remove"
											aria-label={`Remover ${item.nft.name}`}
											disabled={mutation.isPending}
											onClick={() =>
												mutation.mutate({
													method: 'delete',
													path: `/cart/items/${encodeURIComponent(item.id)}`,
												})
											}
										>
											<Trash2 size={22} />
										</button>
										{item.quantity > item.available && (
											<p className="cart-stock-warning" role="alert">
												{item.available
													? `Restam ${item.available} edições. Ajuste a quantidade.`
													: 'Edição esgotada. Remova este item para continuar.'}
											</p>
										)}
									</article>
								))}
							</div>
							<ApiError error={mutation.error} />
						</div>
						<aside className="cart-summary" aria-label="Resumo da carteira">
							<h2>Resumo da carteira</h2>
							<CouponForm coupon={cart.data.coupon} />
							{quote.isPending ? (
								<FormSkeleton />
							) : quote.isError ? (
								<ApiError error={quote.error} retry={() => void quote.refetch()} />
							) : (
								<QuoteTotals quote={quote.data} />
							)}
							<Button asChild disabled={!quote.data || quote.isError}>
								<Link
									to="/pagamento"
									aria-disabled={!quote.data || quote.isError}
									onClick={(event) => {
										if (!quote.data || quote.isError) event.preventDefault()
									}}
								>
									Conectar e finalizar
								</Link>
							</Button>
							<Link className="continue-shopping" to="/">
								Continuar explorando
							</Link>
						</aside>
					</div>
				)}
			</section>
			<RelatedNfts id="" />
		</div>
	)
}
