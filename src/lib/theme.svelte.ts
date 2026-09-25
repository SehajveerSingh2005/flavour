import { browser } from '$app/environment';
import { DEFAULT_FLAVOUR, getFlavour, isFlavourId, type FlavourId } from './flavours';

const STORAGE_KEY = 'flavour:theme';

function createTheme() {
	let current = $state<FlavourId>(DEFAULT_FLAVOUR);

	function apply(id: FlavourId) {
		if (!browser) return;
		document.documentElement.dataset.theme = id;
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute('content', getFlavour(id).swatch[0]);
	}

	/** Read the saved flavour and apply it. Call once on mount. */
	function init() {
		if (!browser) return;
		let saved: string | null = null;
		try {
			saved = localStorage.getItem(STORAGE_KEY);
		} catch {
			/* storage unavailable */
		}
		current = isFlavourId(saved) ? saved : DEFAULT_FLAVOUR;
		apply(current);
	}

	function set(id: FlavourId) {
		current = id;
		apply(id);
		try {
			localStorage.setItem(STORAGE_KEY, id);
		} catch {
			/* storage unavailable */
		}
	}

	return {
		get current() {
			return current;
		},
		set,
		init
	};
}

export const theme = createTheme();
