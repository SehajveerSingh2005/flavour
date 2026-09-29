import { browser } from '$app/environment';
import { DEFAULT_FLAVOUR, getFlavour, isFlavourId, type FlavourId } from './flavours';

const STORAGE_KEY = 'flavour:theme';

function createTheme() {
	let current = $state<FlavourId>(DEFAULT_FLAVOUR);

	/** Paint a flavour onto the document. `current` and the attribute move together. */
	function apply(id: FlavourId) {
		if (!browser) return;
		current = id;
		document.documentElement.dataset.theme = id;
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute('content', getFlavour(id).swatch[0]);
	}

	/** Re-read the saved flavour and apply it. */
	function init() {
		if (!browser) return;
		let saved: string | null = null;
		try {
			saved = localStorage.getItem(STORAGE_KEY);
		} catch {
			/* storage unavailable */
		}
		apply(isFlavourId(saved) ? saved : DEFAULT_FLAVOUR);
	}

	function set(id: FlavourId) {
		apply(id);
		try {
			localStorage.setItem(STORAGE_KEY, id);
		} catch {
			/* storage unavailable */
		}
	}

	const store = { get current() { return current; }, set, init };

	// Sync on load, not in a mount hook: a hot update can re-evaluate this
	// module without re-running onMount, which used to leave `current` on the
	// default flavour while the document kept the previous one — the picker and
	// the page out of sync until a manual reload.
	if (browser) init();

	return store;
}

export const theme = createTheme();
