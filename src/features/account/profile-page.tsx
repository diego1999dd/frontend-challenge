import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus } from 'lucide-react'
import { AccountField } from '@/components/account-field'
import { EnsField } from '@/components/ens-field'
import { ApiError, FormSkeleton, FormSuccess } from '@/components/api-feedback'
import { Button } from '@/components/ui/button'
import { http } from '@/lib/http'
import { useSession } from './session-context'
import { profileOptions, apiFields } from './queries'
import { AccountLayout } from './account-layout'
import type { Profile } from './contracts'

function ProfileForm({ profile }: { profile: Profile }) {
	const client = useQueryClient()
	const [avatar, setAvatar] = useState(profile.avatar)
	const [avatarError, setAvatarError] = useState('')
	const mutation = useMutation({
		mutationFn: async (data: Record<string, FormDataEntryValue>) =>
			(await http.put<Profile>('/profile', { ...data, avatar })).data,
		onSuccess: () => {
			void client.invalidateQueries({ queryKey: profileOptions(profile.id).queryKey })
			void client.invalidateQueries({ queryKey: ['session'] })
		},
	})
	const errors = apiFields(mutation.error)
	return (
		<form
			className="profile-form"
			noValidate
			onSubmit={(event) => {
				event.preventDefault()
				if (!mutation.isPending)
					mutation.mutate(Object.fromEntries(new FormData(event.currentTarget)))
			}}
		>
			<h1>Perfil do colecionador</h1>
			<div className="account-fields">
				<AccountField
					label="Nome de exibição"
					name="name"
					defaultValue={profile.name}
					required
					error={errors.name}
					autoComplete="name"
				/>
				<AccountField
					label="Nome de usuário"
					name="username"
					defaultValue={profile.username}
					required
					error={errors.username}
					autoComplete="username"
				/>
				<AccountField
					label="E-mail"
					type="email"
					name="email"
					defaultValue={profile.email}
					required
					error={errors.email}
					autoComplete="email"
				/>
				<EnsField defaultValue={profile.ens} error={errors.ens} />
				<AccountField
					label="Apelido da carteira"
					name="walletAlias"
					required
					defaultValue={profile.walletAlias}
					error={errors.walletAlias}
				/>
				<div className="avatar-field">
					<p>Avatar</p>
					<div>
						{avatar ? (
							<img src={avatar} alt="Avatar do colecionador" />
						) : (
							<span>
								<ImagePlus size={20} />
							</span>
						)}
						<label className="avatar-upload">
							<input
								type="file"
								aria-label="Alterar avatar"
								accept="image/png,image/jpeg,image/webp"
								onChange={(event) => {
									const file = event.target.files?.[0]
									if (!file) return
									if (
										file.size > 1_000_000 ||
										!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
									) {
										setAvatarError('Envie PNG, JPEG ou WebP de até 1 MB.')
										return
									}
									setAvatarError('')
									const reader = new FileReader()
									reader.onload = () => setAvatar(String(reader.result))
									reader.readAsDataURL(file)
								}}
							/>
							Alterar
						</label>
						<button
							type="button"
							onClick={() => {
								setAvatar('')
								setAvatarError('')
							}}
						>
							Remover
						</button>
					</div>
					{(avatarError || errors.avatar) && <p role="alert">{avatarError || errors.avatar}</p>}
				</div>
			</div>
			<div className="password-fields">
				<h2>Alterar senha</h2>
				<AccountField
					label="Senha atual"
					type="password"
					name="currentPassword"
					autoComplete="current-password"
					error={errors.currentPassword}
				/>
				<AccountField
					label="Nova senha"
					type="password"
					name="password"
					autoComplete="new-password"
					error={errors.password}
				/>
				<AccountField
					label="Confirmar nova senha"
					type="password"
					name="confirmPassword"
					autoComplete="new-password"
					error={errors.confirmPassword}
				/>
			</div>
			<ApiError error={mutation.error} />
			{mutation.isSuccess && <FormSuccess>Perfil salvo com sucesso.</FormSuccess>}
			<Button type="submit" disabled={mutation.isPending}>
				{mutation.isPending ? 'Salvando…' : 'Salvar'}
			</Button>
		</form>
	)
}
export function ProfilePage() {
	const { user } = useSession()
	const query = useQuery(profileOptions(user?.id))
	return (
		<AccountLayout active="Dados do perfil">
			{query.isPending ? (
				<FormSkeleton />
			) : query.isError ? (
				<ApiError error={query.error} retry={() => void query.refetch()} />
			) : (
				<ProfileForm key={query.data.id} profile={query.data} />
			)}
		</AccountLayout>
	)
}
