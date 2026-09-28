import { browser } from '$app/environment';
import type { Track } from './types';

const KEY = 'flavour:history';
const LIMIT = 12;

function isTrack(value: unknown): value is Track {
	if (!value || typeof value !== 'object') return false;
	const t = value as Record<string, unknown>;
	return typeof t.id === 'string' && typeof t.title === 'string';
}

/** Recently played tracks — the seed of the library. */
function createHistory() {
	let items = $state<Track[]>([]);

	function hydrate() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(KEY);
			if (!raw) return;
			const parsed: unknown = JSON.parse(raw);
			if (Array.isArray(parsed)) items = parsed.filter(isTrack).slice(0, LIMIT);
		} catch {
			/* corrupted storage — start fresh */
		}
	}

	function record(track: Track) {
		if (!track?.id) return;
		if (items[0]?.id === track.id) return;
		items = [track, ...items.filter((t) => t.id !== track.id)].slice(0, LIMIT);
		if (!browser) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(items));
		} catch {
			/* storage unavailable */
		}
	}

	function clear() {
		items = [];
		if (!browser) return;
		try {
			localStorage.removeItem(KEY);
		} catch {
			/* storage unavailable */
		}
	}

	return {
		get items() {
			return items;
		},
		record,
		hydrate,
		clear
	};
}

export const history = createHistory();
