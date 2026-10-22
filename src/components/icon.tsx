const assets = {
	hide: '9-963',
	google: '70483-242',
	facebookLogin: '70483-259',
	search: '70486-519',
	cart: '70486-521',
	login: '2-36',
	home: '15-5519',
	user: '15-5522',
	shop: '15-5524',
	heart: '15-5527',
	filter: '15-5313',
	favorite: '15-5427',
	explore: '15-5529',
	facebook: '70491-1270',
	instagram: '70491-1272',
	twitter: '70491-1274',
	linkedin: '70491-1276',
	youtube: '70491-1278',
} as const

// Intrinsic SVG dimensions, preserved exactly from the exported roots.
const dimensions: Record<keyof typeof assets, readonly [number, number]> = {
	hide: [23, 20],
	google: [20, 20],
	facebookLogin: [20, 20],
	search: [20, 20],
	cart: [24, 24],
	login: [24, 24],
	home: [20, 20],
	user: [20, 20],
	shop: [20, 20],
	heart: [20, 18],
	filter: [24, 24],
	favorite: [15, 14],
	explore: [27, 24],
	facebook: [8, 16],
	instagram: [16, 16],
	twitter: [16, 13],
	linkedin: [16, 16],
	youtube: [19, 14],
}

export function Icon({ name }: { name: keyof typeof assets }) {
	return (
		<img
			src={`/images/icons/${assets[name]}.svg`}
			alt=""
			aria-hidden="true"
			className="design-icon"
			width={dimensions[name][0]}
			height={dimensions[name][1]}
		/>
	)
}
