import { useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { AccountField } from '@/components/account-field'
import { ApiError } from '@/components/api-feedback'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icon'
import { useNotice } from '@/components/notice-provider'
import { CatalogPage } from '@/features/catalog/catalog-page'
import { useSession } from './session-context'
import { apiFields } from './queries'
import { safeRedirect } from './safe-redirect'

export function AuthPage({ register = false }: { register?: boolean }) {
	const session = useSession()
	const navigate = useNavigate()
	const redirect = useRouterState({
		select: (state) => safeRedirect((state.location.search as Record<string, unknown>).redirect),
	})
	const notice = useNotice()
	const [error, setError] = useState<unknown>(null)
	const [pending, setPending] = useState(false)
	const fields = apiFields(error)
	const title = register ? 'Criar conta' : 'Entrar'
	const move = (signup: boolean) => {
		setError(null)
		void navigate({ to: signup ? '/cadastro' : '/login', search: { redirect } })
	}
	return (
		<>
			<div className="auth-background" aria-hidden="true" inert>
				<CatalogPage />
			</div>
			<Dialog.Root
				open
				onOpenChange={(open) => {
					if (!open) void navigate({ to: '/' })
				}}
			>
				<Dialog.Portal>
					<Dialog.Overlay className="auth-overlay" />
					<Dialog.Content
						className={`auth-panel ${register ? 'auth-panel--register' : ''}`}
						aria-describedby="auth-description"
					>
						<Dialog.Close className="auth-close" aria-label="Fechar autenticação">
							<X size={18} />
						</Dialog.Close>
						<div className="auth-mobile-logo">
							<img src="/images/brand/70399-239.svg" alt="Kurio" />
						</div>
						<div className="auth-tabs">
							<button
								type="button"
								className={!register ? 'is-active' : ''}
								onClick={() => move(false)}
							>
								Entrar
							</button>
							<span aria-hidden="true">|</span>
							<button
								type="button"
								className={register ? 'is-active' : ''}
								onClick={() => move(true)}
							>
								Criar conta
							</button>
						</div>
						<Dialog.Title className="auth-mobile-title">{title}</Dialog.Title>
						<Dialog.Description id="auth-description" className="auth-description">
							{register
								? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
								: 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
						</Dialog.Description>
						<form
							className="auth-form"
							noValidate
							onSubmit={async (event) => {
								event.preventDefault()
								if (pending) return
								setPending(true)
								setError(null)
								const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<
									string,
									string
								>
								try {
									if (register) await session.register(data)
									else await session.login({ email: data.email, password: data.password })
									await navigate({ href: redirect, replace: true })
								} catch (error) {
									setError(error)
								} finally {
									setPending(false)
								}
							}}
						>
							{session.expired && !register && (
								<p role="status" className="text-text-accent">
									Sua sessão expirou. Entre para retomar de onde parou.
								</p>
							)}
							<div className="auth-inputs">
								{register && (
									<AccountField
										label="Nome de usuário"
										name="username"
										placeholder="Nome de usuário"
										autoComplete="username"
										required
										error={fields.username}
									/>
								)}
								<AccountField
									label="E-mail"
									name="email"
									type="email"
									placeholder={register ? 'Digite seu e-mail' : 'contato@email.com'}
									autoComplete="email"
									required
									error={fields.email}
								/>
								<AccountField
									label="Senha"
									name="password"
									type="password"
									placeholder="Senha"
									autoComplete={register ? 'new-password' : 'current-password'}
									required
									error={fields.password}
								/>
								{register && (
									<AccountField
										label="Confirmar senha"
										name="confirmPassword"
										type="password"
										placeholder="Confirmar senha"
										autoComplete="new-password"
										required
										error={fields.confirmPassword}
									/>
								)}
								{!register && (
									<button
										type="button"
										className="auth-forgot"
										onClick={() =>
											notice(
												'Recuperar senha',
												'Recuperação por e-mail não faz parte da simulação. As credenciais fictícias estão em Contas de demonstração.',
											)
										}
									>
										Esqueceu a senha?
									</button>
								)}
							</div>
							<ApiError error={error} />
							<Button className="auth-submit" disabled={pending}>
								{pending ? 'Aguarde…' : title}
							</Button>
						</form>
						<div className="auth-social">
							<p>
								<span>Ou continue com</span>
							</p>
							{(['Google', 'Facebook'] as const).map((provider) => (
								<Button
									key={provider}
									variant="outline"
									onClick={() =>
										notice(
											`Entrar com ${provider}`,
											'Login social não está conectado a uma conta real. Use uma das contas fictícias ou crie um cadastro nesta demonstração.',
										)
									}
								>
									<Icon name={provider === 'Google' ? 'google' : 'facebookLogin'} />
									Continuar com {provider}
								</Button>
							))}
						</div>
						<div className="auth-switch">
							<span>{register ? 'Já tem uma conta? ' : 'Não tem uma conta? '}</span>
							<button onClick={() => move(!register)}>{register ? 'Entrar' : 'Criar conta'}</button>
						</div>
						<details className="demo-credentials">
							<summary>Contas de demonstração</summary>
							<p>
								ana@kurio.test ou bruno@kurio.test
								<br />
								Senha: Demo123!
							</p>
							<p>Dados fictícios. Não use informações pessoais reais.</p>
						</details>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	)
}
