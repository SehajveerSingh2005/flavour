import { browser } from '$app/environment';

const KEY = 'flavour:onboarded';
/** any of these means this browser is not a first-timer */
const DATA_KEYS = [
	'flavour:history',
	'flavour:mixes',
	'flavour:queue',
	'flavour:likes',
	'flavour:recents'
];

/**
 * The welcome tour: shown once, on a browser with no data in it yet.
 * Dismissal is remembered; the cheat sheet can bring it back on demand.
 */
function createOnboarding() {
	let open = $state(false);

	function maybeShow() {
		if (!browser) return;
		try {
			if (localStorage.getItem(KEY)) return;
			if (DATA_KEYS.some((key) => localStorage.getItem(key))) return;
			open = true;
		} catch {
			/* private mode — skip the tour */
		}
	}

	function show() {
		open = true;
	}

	function dismiss() {
		open = false;
		if (!browser) return;
		try {
			localStorage.setItem(KEY, '1');
		} catch {
			/* storage unavailable */
		}
	}

	return {
		get open() {
			return open;
		},
		maybeShow,
		show,
		dismiss
	};
}

export const onboarding = createOnboarding();
