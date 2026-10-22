import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
	UserRound,
	Wallet,
	ShoppingCart,
	Heart,
	ChartNoAxesCombined,
	Download,
	TriangleAlert,
	LogOut,
} from 'lucide-react'
import { useNotice } from '@/components/notice-provider'
import { useSession } from './session-context'

export function AccountLayout({ children, active }: { children: ReactNode; active: string }) {
	const { logout } = useSession()
	const navigate = useNavigate()
	const notice = useNotice()
	return (
		<div className="account-layout">
			<nav className="account-sidebar" aria-label="Minha conta">
				<h2>Meu perfil</h2>
				{[
					{ label: 'Dados do perfil', to: '/perfil' as const, icon: UserRound },
					{ label: 'Carteiras', to: '/carteiras' as const, icon: Wallet },
					{ label: 'Meus pedidos', to: '/pedidos' as const, icon: ShoppingCart },
					{ label: 'Lista de interesse', to: '/favoritos' as const, icon: Heart },
				].map((item) => (
					<Link key={item.to} to={item.to} className={active === item.label ? 'is-active' : ''}>
						<item.icon size={18} />
						{item.label}
					</Link>
				))}
				{[
					{ label: 'Ofertas', icon: ChartNoAxesCombined },
					{ label: 'Arquivos baixados', icon: Download },
					{ label: 'Suporte', icon: TriangleAlert },
				].map((item) => (
					<button
						key={item.label}
						onClick={() => notice(item.label, 'Esta seção não faz parte do escopo do desafio.')}
					>
						<item.icon size={18} />
						{item.label}
					</button>
				))}
				<button
					className="account-logout"
					onClick={async () => {
						await logout()
						await navigate({ to: '/' })
					}}
				>
					<LogOut size={18} />
					Sair
				</button>
			</nav>
			<div className="account-content">{children}</div>
		</div>
	)
}
