import { nftImages } from '@/lib/assets'
import { useNotice } from '@/components/notice-provider'

const articles = [
	{
		image: nftImages.ivory,
		date: '12 de setembro',
		minutes: 6,
		title: 'Como funciona a propriedade de NFTs',
		description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
	},
	{
		image: nftImages.emerald,
		date: '13 de setembro',
		minutes: 2,
		title: '10 artistas digitais para acompanhar',
		description: 'Conheça criadores que moldam a cultura digital.',
	},
	{
		image: nftImages.sage,
		date: '15 de setembro',
		minutes: 3,
		title: 'Raridade, atributos e procedência',
		description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
	},
	{
		image: nftImages.golden,
		date: '15 de setembro',
		minutes: 2,
		title: 'Como proteger sua carteira',
		description: 'Proteja sua carteira, seus ativos e sua identidade.',
	},
]
export function SectionJournal() {
	const notice = useNotice()
	return (
		<section className="home-journal" aria-labelledby="journal-heading" data-design="blog">
			<div>
				<h2 id="journal-heading">Diário da Cunhagem</h2>
				<p>
					Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
				</p>
			</div>
			<div className="journal-grid">
				{articles.map((article) => (
					<div className="journal-card" key={article.title}>
						<img src={article.image} alt="" width={268} height={195} loading="lazy" />
						<div>
							<p>
								{article.date} | Leitura de {article.minutes} min
							</p>
							<h3>{article.title}</h3>
							<p>{article.description}</p>
							<button
								onClick={() =>
									notice(
										article.title,
										'As páginas editoriais não fazem parte do escopo deste teste.',
									)
								}
							>
								Ler mais →
							</button>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
