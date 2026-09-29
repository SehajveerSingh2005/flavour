import { browser } from '$app/environment';
import type { Collection, LikedItem, LikedTrack, Track } from './types';

const KEY = 'flavour:likes';
/** sanity cap so the shelf can't grow forever */
const LIMIT = 500;

function isTrack(value: unknown): value is Track {
	if (!value || typeof value !== 'object') return false;
	const t = value as Record<string, unknown>;
	return typeof t.id === 'string' && typeof t.title === 'string';
}

/** Accepts the union and the older track-only shape. */
function toItem(value: unknown): LikedItem | null {
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
	// pre-collections likes: a bare track
	return isTrack(value) ? { type: 'track', track: value } : null;
}

/**
 * Liked tracks and albums/playlists — local-first, newest first.
 * Albums and playlists are stored as light references: opening one always
 * fetches the current track list, so a liked album never goes stale.
 */
function createLikes() {
	let items = $state<LikedItem[]>([]);

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
			if (Array.isArray(parsed)) {
				items = parsed
					.map(toItem)
					.filter((item): item is LikedItem => item !== null)
					.slice(0, LIMIT);
			}
		} catch {
			/* corrupted storage — start fresh */
		}
	}

	function hasTrack(id: string): boolean {
		return items.some((item) => item.type === 'track' && item.track.id === id);
	}

	function hasCollection(kind: 'album' | 'playlist', id: string): boolean {
		return items.some((item) => item.type === kind && item.id === id);
	}

	/** Returns true when the track is liked after the toggle. */
	function toggleTrack(track: Track): boolean {
		if (!track?.id) return false;
		const liked = hasTrack(track.id);
		if (liked) {
			items = items.filter((item) => !(item.type === 'track' && item.track.id === track.id));
		} else {
			const entry: LikedItem = { type: 'track', track };
			items = [entry, ...items].slice(0, LIMIT);
		}
		persist();
		return !liked;
	}

	/** Returns true when the collection is liked after the toggle. */
	function toggleCollection(collection: Collection): boolean {
		if (!collection?.id) return false;
		const liked = hasCollection(collection.kind, collection.id);
		if (liked) {
			items = items.filter((item) => !(item.type === collection.kind && item.id === collection.id));
		} else {
			const entry: LikedItem = {
				type: collection.kind,
				id: collection.id,
				title: collection.title,
				subtitle: collection.subtitle,
				art: collection.art
			};
			items = [entry, ...items].slice(0, LIMIT);
		}
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
		/** just the tracks — what the “play all” queue on home uses */
		get tracks(): Track[] {
			return items
				.filter((item): item is LikedTrack => item.type === 'track')
				.map((item) => item.track);
		},
		hasTrack,
		hasCollection,
		toggleTrack,
		toggleCollection,
		clear,
		hydrate
	};
}

export const likes = createLikes();
