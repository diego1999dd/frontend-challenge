import { useQueries } from '@tanstack/react-query'
import { NftCard } from '@/components/nft/nft-card'
import { NftGrid } from '@/components/nft/nft-grid'
import { ApiError, FormSkeleton } from '@/components/api-feedback'
import { PageState } from '@/components/page-state'
import { nftOptions } from '@/features/catalog/queries'
import { useFavorites } from './queries'
import { AccountLayout } from './account-layout'

export function FavoritesPage() {
	const favorites = useFavorites()
	const lists = useQueries({ queries: (favorites.data || []).map((id) => nftOptions(id)) })
	const error = favorites.error || lists.find((query) => query.error)?.error
	const loading = favorites.isPending || lists.some((query) => query.isPending)
	const items = lists.flatMap((query) => (query.data ? [query.data] : []))
	return (
		<AccountLayout active="Lista de interesse">
			<h1 className="mb-8 font-bold">Lista de interesse</h1>
			{loading ? (
				<FormSkeleton />
			) : error ? (
				<ApiError
					error={error}
					retry={() => {
						void favorites.refetch()
						lists.forEach((query) => void query.refetch())
					}}
				/>
			) : !items.length ? (
				<PageState
					title="Nenhum favorito ainda"
					description="Toque no coração de um NFT para salvar na sua conta."
				/>
			) : (
				<NftGrid>
					{items.map((nft) => (
						<NftCard key={nft.id} nft={nft} />
					))}
				</NftGrid>
			)}
		</AccountLayout>
	)
}
