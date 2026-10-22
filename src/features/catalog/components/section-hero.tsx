import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { nftImages } from '@/lib/assets'

export function SectionHero() {
	return (
		<section aria-labelledby="hero-heading" className="home-hero" data-design="hero">
			<div className="home-hero__copy">
				<div>
					<p className="home-hero__eyebrow">Bem-vindo à Kurio</p>
					<h1 id="hero-heading">
						<span className="desktop-copy">
							SEJA DONO DO FUTURO
							<br />
							DA ARTE DIGITAL
						</span>
						<span className="mobile-copy">
							SEJA DONO DA
							<br />
							CULTURA DIGITAL
						</span>
					</h1>
					<p className="home-hero__description">
						<span className="desktop-copy">
							Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
							digital rara, apoie artistas e tenha uma parte da cultura da internet.
						</span>
						<span className="mobile-copy">
							Descubra NFTs selecionados de criadores do mundo todo.
						</span>
					</p>
				</div>
				<Button asChild className="home-hero__cta">
					<a href="#catalogo">
						EXPLORAR
						<ArrowRight className="mobile-copy" size={16} />
					</a>
				</Button>
				<div className="hero-dots" aria-hidden="true">
					<i />
					<i />
					<i />
				</div>
			</div>
			<div className="home-hero__art">
				<img
					src={nftImages.emerald}
					alt="Emerald Ape com óculos e jaqueta verde"
					width={1254}
					height={1254}
					fetchPriority="high"
				/>
				<img
					className="home-hero__secondary"
					src={nftImages.sage}
					alt="Sage Nomad com chapéu e moletom lilás"
					width={1254}
					height={1254}
				/>
			</div>
		</section>
	)
}
