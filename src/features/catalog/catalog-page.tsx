import { SectionHero } from './components/section-hero'
import { CatalogSearchBar, SectionCatalog } from './components/section-catalog'
import { SectionPromos } from './components/section-promos'
import { SectionJournal } from './components/section-journal'

export function CatalogPage() {
	return (
		<>
			<CatalogSearchBar />
			<SectionHero />
			<SectionCatalog />
			<SectionPromos />
			<SectionJournal />
		</>
	)
}
