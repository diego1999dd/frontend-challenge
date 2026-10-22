import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccountField, AccountSelect } from '@/components/account-field'
import { EnsField } from '@/components/ens-field'
import { ApiError, FormSkeleton, FormSuccess } from '@/components/api-feedback'
import { Button } from '@/components/ui/button'
import { http } from '@/lib/http'
import { useSession } from './session-context'
import { walletsOptions, apiFields } from './queries'
import { AccountLayout } from './account-layout'
import type { Wallet } from './contracts'

function WalletForm({
	wallet,
	secondary = false,
	onSaved,
	primaryWallet,
}: {
	wallet?: Wallet
	secondary?: boolean
	onSaved: () => void
	primaryWallet?: Wallet
}) {
	const [copyPrimary, setCopyPrimary] = useState(false)
	const values = copyPrimary && primaryWallet ? { ...primaryWallet, alias: 'Secundária' } : wallet
	const mutation = useMutation({
		mutationFn: async (data: Record<string, FormDataEntryValue>) =>
			(await http.put(`/wallets/${wallet?.id || 'new'}`, data)).data,
		onSuccess: onSaved,
	})
	const errors = apiFields(mutation.error)
	return (
		<form
			className="wallet-form"
			noValidate
			onSubmit={(event) => {
				event.preventDefault()
				if (!mutation.isPending)
					mutation.mutate(Object.fromEntries(new FormData(event.currentTarget)))
			}}
		>
			<header>
				<h1>{secondary ? 'Carteira secundária' : 'Carteira principal'}</h1>
				<p>Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
			</header>
			{secondary && primaryWallet && (
				<label className="copy-primary-wallet">
					<input
						type="checkbox"
						checked={copyPrimary}
						onChange={(event) => setCopyPrimary(event.target.checked)}
					/>{' '}
					Igual à carteira principal
				</label>
			)}
			<div className="account-fields" key={String(copyPrimary)}>
				<AccountField
					label="Nome de exibição"
					name="name"
					defaultValue={values?.name}
					required
					error={errors.name}
				/>
				<AccountField
					label="Apelido da carteira"
					name="alias"
					defaultValue={values?.alias}
					required
					error={errors.alias}
				/>
				<AccountSelect
					label="Rede"
					name="network"
					defaultValue={values?.network || ''}
					required
					error={errors.network}
				>
					<option value="">Selecione uma rede</option>
					<option value="ethereum">Ethereum</option>
					<option value="polygon">Polygon</option>
					<option value="solana">Solana</option>
				</AccountSelect>
				<AccountField
					label="Nome do perfil"
					name="profileName"
					defaultValue={values?.profileName}
					required
					error={errors.profileName}
				/>
				<AccountField
					label="Endereço da carteira"
					name="address"
					defaultValue={values?.address}
					placeholder="Endereço público da carteira"
					required
					error={errors.address}
				/>
				<AccountField
					label="ENS ou carteira secundária (opcional)"
					name="secondaryAddress"
					placeholder="ENS ou carteira secundária (opcional)"
					defaultValue={values?.secondaryAddress}
					error={errors.secondaryAddress}
				/>
				<AccountSelect
					label="Tipo de carteira"
					name="provider"
					defaultValue={values?.provider || ''}
					required
					error={errors.provider}
				>
					<option value="">Selecione uma carteira</option>
					{['MetaMask', 'WalletConnect', 'Coinbase', 'Phantom'].map((provider) => (
						<option key={provider}>{provider}</option>
					))}
				</AccountSelect>
				<AccountField
					label="Código de indicação"
					name="referral"
					required
					defaultValue={values?.referral}
					error={errors.referral}
				/>
				<AccountField
					label="E-mail"
					name="email"
					required
					type="email"
					defaultValue={values?.email}
					error={errors.email}
				/>
				<EnsField defaultValue={values?.ens} error={errors.ens} />
			</div>
			<ApiError error={mutation.error} />
			{mutation.isSuccess && <FormSuccess>Carteira salva com sucesso.</FormSuccess>}
			<Button disabled={mutation.isPending}>
				{mutation.isPending ? 'Salvando…' : 'Salvar carteira'}
			</Button>
		</form>
	)
}
export function WalletsPage() {
	const { user } = useSession()
	const client = useQueryClient()
	const query = useQuery(walletsOptions(user?.id))
	const [adding, setAdding] = useState(false)
	const saved = () => {
		void client.invalidateQueries({ queryKey: walletsOptions(user?.id).queryKey })
	}
	return (
		<AccountLayout active="Carteiras">
			{query.isPending ? (
				<FormSkeleton />
			) : query.isError ? (
				<ApiError error={query.error} retry={() => void query.refetch()} />
			) : (
				<div className="wallets-forms">
					<WalletForm key={query.data[0]?.id || 'main'} wallet={query.data[0]} onSaved={saved} />
					{query.data[1] || adding ? (
						<WalletForm
							key={query.data[1]?.id || 'secondary'}
							wallet={query.data[1]}
							primaryWallet={query.data[0]}
							secondary
							onSaved={saved}
						/>
					) : (
						<section className="secondary-wallet">
							<h2>Carteira secundária</h2>
							<Button variant="link" onClick={() => setAdding(true)} disabled={!query.data[0]}>
								Adicionar
							</Button>
							<p>Você ainda não adicionou uma carteira secundária.</p>
						</section>
					)}
				</div>
			)}
		</AccountLayout>
	)
}
