import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/page-state'
import { NftDetail } from './components/nft-detail'
import { NftDetailSkeleton } from './components/nft-detail-skeleton'
import { nftOptions } from './queries'
import { parseCatalogSearch } from './contracts'

const route = getRouteApi('/nfts/$nftId')

export function NftPage() {
	const { nftId } = route.useParams()
	const query = useQuery(nftOptions(nftId))
	const notFound = isAxiosError(query.error) && query.error.response?.status === 404
	return (
		<>
			{!query.data && (
				<Link
					to="/"
					search={parseCatalogSearch({})}
					className="mb-8 inline-block text-sm text-text-secondary underline underline-offset-4"
				>
					Voltar ao catálogo
				</Link>
			)}
			{query.isPending && <NftDetailSkeleton />}
			{query.isError && (
				<PageState
					kind="error"
					title={notFound ? 'NFT não encontrado' : 'Não foi possível carregar este NFT'}
					description={
						notFound
							? 'A obra não existe ou não está mais disponível.'
							: 'Tente novamente em alguns instantes.'
					}
					action={
						!notFound && <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
					}
				/>
			)}
			{query.data && <NftDetail nft={query.data} />}
		</>
	)
}
