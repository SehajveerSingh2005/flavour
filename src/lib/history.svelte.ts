import { browser } from '$app/environment';
import type { HistoryItem, Track } from './types';

const KEY = 'flavour:history';
const LIMIT = 12;

function isTrack(value: unknown): value is Track {
	if (!value || typeof value !== 'object') return false;
	const t = value as Record<string, unknown>;
	return typeof t.id === 'string' && typeof t.title === 'string';
}

/** Accepts the current shape and the older track-only one. */
function toItem(value: unknown): HistoryItem | null {
	if (!value || typeof value !== 'object') return null;
	const item = value as Record<string, unknown>;
	if (item.type === 'track' && isTrack(item.track)) return { type: 'track', track: item.track };
	if (
		(item.type === 'album' || item.type === 'playlist') &&
		typeof item.id === 'string' &&
		typeof item.title === 'string'
	) {
		return {
			type: item.type,
			id: item.id,
			title: item.title,
			subtitle: typeof item.subtitle === 'string' ? item.subtitle : '',
			art: typeof item.art === 'string' ? item.art : ''
		};
	}
	// pre-collections storage: a bare track
	return isTrack(value) ? { type: 'track', track: value } : null;
}

/** Recently played — tracks you played, and albums/playlists you opened. */
function createHistory() {
	let items = $state<HistoryItem[]>([]);
	let hydrated = $state(false);

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
			if (raw) {
				const parsed: unknown = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					items = parsed
						.map(toItem)
						.filter((item): item is HistoryItem => item !== null)
						.slice(0, LIMIT);
				}
			}
		} catch {
			/* corrupted storage — start fresh */
		}
		hydrated = true;
	}

	/** Drop an older entry with the same identity, newest first. */
	function push(item: HistoryItem, same: (existing: HistoryItem) => boolean) {
		items = [item, ...items.filter((existing) => !same(existing))].slice(0, LIMIT);
		persist();
	}

	function record(track: Track) {
		if (!track?.id) return;
		const head = items[0];
		if (head?.type === 'track' && head.track.id === track.id) return;
		push({ type: 'track', track }, (item) => item.type === 'track' && item.track.id === track.id);
	}

	function recordCollection(
		kind: 'album' | 'playlist',
		collection: { id: string; title: string; subtitle: string; art: string }
	) {
		if (!collection?.id) return;
		const head = items[0];
		if (head?.type === kind && head.id === collection.id) return;
		push({ type: kind, ...collection }, (item) => item.type === kind && item.id === collection.id);
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
		get hydrated() {
			return hydrated;
		},
		record,
		recordCollection,
		hydrate,
		clear
	};
}

export const history = createHistory();
