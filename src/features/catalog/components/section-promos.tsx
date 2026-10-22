import { ArrowRight } from 'lucide-react'
import { nftImages } from '@/lib/assets'
import { Button } from '@/components/ui/button'

export function SectionPromos() {
	return (
		<section className="home-promos" aria-label="Coleções selecionadas" data-design="promos">
			{[
				{
					image: nftImages.emerald,
					title: (
						<>
							Lançamentos gênesis
							<br />
							de edição limitada
						</>
					),
					description:
						'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
				},
				{
					image: nftImages.ivory,
					title: (
						<>
							Arte digital selecionada
							<br />e muito mais
						</>
					),
					description:
						'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
				},
			].map((promo, index) => (
				<div className="promo-card" key={index}>
					<img
						src={promo.image}
						alt="NFT da coleção selecionada"
						width={292}
						height={250}
						loading="lazy"
					/>
					<div>
						<h2>{promo.title}</h2>
						<p>{promo.description}</p>
						<Button asChild>
							<a href="#catalogo">
								Explorar
								<ArrowRight size={16} />
							</a>
						</Button>
					</div>
				</div>
			))}
		</section>
	)
}
