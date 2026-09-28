import { browser } from '$app/environment';

const KEY = 'flavour:panels';

/**
 * Which half of the side rail is expanded.
 *
 * The deck and the queue take turns: expanding the queue minimises the deck so
 * the queue gets the full height, and expanding the deck tucks the queue away.
 */
function createUi() {
	let deckMini = $state(false);
	let queueOpen = $state(false);

	function persist() {
		if (!browser) return;
		try {
			localStorage.setItem(KEY, JSON.stringify({ deckMini, queueOpen }));
		} catch {
			/* storage unavailable */
		}
	}

	function hydrate() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as { deckMini?: unknown; queueOpen?: unknown };
			deckMini = !!parsed.deckMini;
			queueOpen = !!parsed.queueOpen;
		} catch {
			/* corrupted storage — use defaults */
		}
	}

	function toggleDeck() {
		deckMini = !deckMini;
		if (!deckMini) queueOpen = false;
		persist();
	}

	function toggleQueue() {
		queueOpen = !queueOpen;
		// expanding the queue minimises the deck; closing it brings the deck back
		deckMini = queueOpen;
		persist();
	}

	return {
		get deckMini() {
			return deckMini;
		},
		get queueOpen() {
			return queueOpen;
		},
		toggleDeck,
		toggleQueue,
		hydrate
	};
}

export const ui = createUi();
