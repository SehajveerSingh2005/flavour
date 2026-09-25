export const FLAVOUR_IDS = [
	'matcha',
	'pistachio',
	'taro',
	'mango',
	'blueberry',
	'strawberry',
	'espresso',
	'vanilla'
] as const;

export type FlavourId = (typeof FLAVOUR_IDS)[number];

export interface Flavour {
	id: FlavourId;
	name: string;
	note: string;
	/** [background, accent] used for the picker swatch */
	swatch: [string, string];
}

export const FLAVOURS: Flavour[] = [
	{ id: 'matcha', name: 'Matcha', note: 'earthy & awake', swatch: ['#e9f2da', '#3d7a26'] },
	{ id: 'pistachio', name: 'Pistachio', note: 'nutty & mellow', swatch: ['#f4efdd', '#70973f'] },
	{ id: 'taro', name: 'Taro', note: 'creamy & dreamy', swatch: ['#ede8fa', '#7a58c3'] },
	{ id: 'mango', name: 'Mango', note: 'sunny & loud', swatch: ['#ffefd2', '#ee8f0d'] },
	{ id: 'blueberry', name: 'Blueberry', note: 'cool & focused', swatch: ['#e6ecfb', '#3b5bdb'] },
	{ id: 'strawberry', name: 'Strawberry', note: 'sweet & fizzy', swatch: ['#ffe7ee', '#e0356e'] },
	{ id: 'espresso', name: 'Espresso', note: 'dark roast, late night', swatch: ['#2b211c', '#dfa054'] },
	{ id: 'vanilla', name: 'Vanilla', note: 'clean & classic', swatch: ['#f5f0e6', '#1e1a15'] }
];

export const DEFAULT_FLAVOUR: FlavourId = 'matcha';

export function isFlavourId(value: unknown): value is FlavourId {
	return typeof value === 'string' && (FLAVOUR_IDS as readonly string[]).includes(value);
}

export function getFlavour(id: FlavourId): Flavour {
	return FLAVOURS.find((f) => f.id === id) ?? FLAVOURS[0];
}
