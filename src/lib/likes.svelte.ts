import { browser } from '$app/environment';
import type { Track } from './types';

const KEY = 'flavour:likes';
/** sanity cap so the shelf can't grow forever */
const LIMIT = 500;

function isTrack(value: unknown): value is Track {
	if (!value || typeof value !== 'object') return false;
	const t = value as Record<string, unknown>;
	return typeof t.id === 'string' && typeof t.title === 'string';
}

/** Liked tracks — local-first, newest first, like mixes and history. */
function createLikes() {
	let items = $state<Track[]>([]);

	function persist() {
		if (!browser) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(items));
		} catch {
			/* storage unavailable */
		}
	}

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

	function has(id: string): boolean {
		return items.some((track) => track.id === id);
	}

	/** Returns true when the track is liked after the toggle. */
	function toggle(track: Track): boolean {
		if (!track?.id) return false;
		const liked = has(track.id);
		items = liked ? items.filter((t) => t.id !== track.id) : [track, ...items].slice(0, LIMIT);
		persist();
		return !liked;
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
		has,
		toggle,
		clear,
		hydrate
	};
}

export const likes = createLikes();
