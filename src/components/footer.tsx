import { Icon } from './icon'
import { Brand } from './brand'
import { useNotice } from './notice-provider'
import { useNavigate } from '@tanstack/react-router'
import { parseCatalogSearch } from '@/features/catalog/contracts'

const features = [
	{
		letter: 'W',
		title: 'Segurança da carteira',
		text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
	},
	{
		letter: 'C',
		title: 'Criadores em destaque',
		text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
	},
	{
		letter: 'D',
		title: 'Alertas de lançamentos',
		text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
	},
]
const columns = [
	{
		title: 'Meu perfil',
		links: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
	},
	{
		title: 'Central de ajuda',
		links: [
			'Central de ajuda',
			'Como comprar NFTs',
			'Carteira e segurança',
			'Política do mercado',
			'Denunciar item',
		],
	},
	{ title: 'Coleções', links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
]

export function Footer() {
	const notice = useNotice()
	const navigate = useNavigate()
	return (
		<footer className="market-footer" data-design="footer">
			<div className="market-footer__features">
				{features.map((feature) => (
					<div key={feature.letter} className="footer-feature">
						<span>{feature.letter}</span>
						<h3>{feature.title}</h3>
						<p>{feature.text}</p>
					</div>
				))}
				<div className="footer-newsletter">
					<h3>Antecipe-se ao próximo lançamento</h3>
					<form
						onSubmit={(event) => {
							event.preventDefault()
							notice(
								'Alertas de lançamentos',
								'O cadastro de alertas não faz parte do escopo desta demonstração. Nenhum e-mail foi cadastrado.',
							)
						}}
					>
						<input
							type="email"
							required
							aria-label="E-mail para alertas"
							placeholder="digite seu e-mail..."
						/>
						<button>Enviar</button>
					</form>
					<p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
				</div>
			</div>
			<div className="market-footer__contact">
				<Brand />
				<p className="text-foreground">
					Feito para colecionadores,
					<br />
					criadores e cultura
				</p>
				<span className="text-foreground">contato@email.com</span>
				<span className="text-foreground">+55 11 4002 8922</span>
			</div>
			<div className="market-footer__links">
				{columns.map((column) => (
					<div key={column.title}>
						<h3>{column.title}</h3>
						<ul>
							{column.links.map((label) => (
								<li key={label}>
									<button
										onClick={() => {
											const category = {
												'Arte digital': 'art',
												Fotografia: 'photography',
												Música: 'music',
												'Arte 3D': '3d',
												Utilidade: 'utility',
											}[label]
											if (category) {
												void navigate({
													to: '/',
													search: parseCatalogSearch({ category }),
													hash: 'catalogo',
												})
												return
											}
											if (label === 'Meu perfil') void navigate({ to: '/perfil' })
											else if (label === 'Lista de interesse') void navigate({ to: '/favoritos' })
											else if (label === 'Minha coleção') void navigate({ to: '/pedidos' })
											else if (label === 'Carteira e segurança') void navigate({ to: '/carteiras' })
											else notice(label, 'Esta página não faz parte do escopo da demonstração.')
										}}
									>
										{label}
									</button>
								</li>
							))}
						</ul>
					</div>
				))}
				<div>
					<h3>Redes sociais</h3>
					<div className="footer-social">
						{(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'] as const).map(
							(name, index) => (
								<button
									key={name}
									aria-label={['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube'][index]}
									onClick={() =>
										notice(
											'Redes sociais',
											'Não há um perfil externo de redes sociais associado a esta demonstração.',
										)
									}
								>
									<Icon name={name} />
								</button>
							),
						)}
					</div>
					<h3 className="mt-8">Carteiras compatíveis</h3>
					<p className="footer-wallets">METAMASK · WALLETCONNECT · COINBASE</p>
				</div>
			</div>
			<p className="market-footer__copyright">© 2026 Kurio. Propriedade digital para todos.</p>
		</footer>
	)
}
