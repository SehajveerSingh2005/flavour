import { browser } from '$app/environment';
import type { Track } from './types';

const KEY = 'flavour:mixes';
/** sanity cap so one mix can't grow forever */
const LIMIT = 300;

export interface Mix {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	tracks: Track[];
}

function isTrack(value: unknown): value is Track {
	if (!value || typeof value !== 'object') return false;
	const t = value as Record<string, unknown>;
	return typeof t.id === 'string' && typeof t.title === 'string';
}

function isMix(value: unknown): value is Mix {
	if (!value || typeof value !== 'object') return false;
	const m = value as Record<string, unknown>;
	return (
		typeof m.id === 'string' &&
		typeof m.name === 'string' &&
		Array.isArray(m.tracks) &&
		typeof m.createdAt === 'number'
	);
}

function newId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Oldest last: newest mixes first. */
function sorted(list: Mix[]): Mix[] {
	return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * User-made mixes — local-first, persisted like queue/history.
 * A mix is a snapshot of tracks: it keeps playing even if the source disappears.
 */
function createMixes() {
	let items = $state<Mix[]>([]);

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
			if (!Array.isArray(parsed)) return;
			items = parsed.filter(isMix).map((mix) => ({
				id: mix.id,
				name: mix.name,
				createdAt: mix.createdAt,
				updatedAt: mix.updatedAt ?? mix.createdAt,
				tracks: mix.tracks.filter(isTrack).slice(0, LIMIT)
			}));
		} catch {
			/* corrupted storage — start fresh */
		}
	}

	function create(name: string, tracks: Track[] = []): Mix {
		const now = Date.now();
		const mix: Mix = {
			id: newId(),
			name: name.trim() || 'new mix',
			createdAt: now,
			updatedAt: now,
			tracks: tracks.slice(0, LIMIT)
		};
		items = sorted([mix, ...items]);
		persist();
		return mix;
	}

	function remove(id: string) {
		items = items.filter((mix) => mix.id !== id);
		persist();
	}

	function rename(id: string, name: string) {
		const clean = name.trim();
		if (!clean) return;
		items = sorted(
			items.map((mix) => (mix.id === id ? { ...mix, name: clean, updatedAt: Date.now() } : mix))
		);
		persist();
	}

	function addTrack(id: string, track: Track) {
		items = sorted(
			items.map((mix) =>
				mix.id === id
					? {
							...mix,
							tracks: [...mix.tracks.filter((t) => t.id !== track.id), track].slice(0, LIMIT),
							updatedAt: Date.now()
						}
					: mix
			)
		);
		persist();
	}

	function addTracks(id: string, tracks: Track[]) {
		items = sorted(
			items.map((mix) => {
				if (mix.id !== id) return mix;
				const seen = new Set(mix.tracks.map((t) => t.id));
				const fresh = tracks.filter((t) => t.id && !seen.has(t.id));
				return {
					...mix,
					tracks: [...mix.tracks, ...fresh].slice(0, LIMIT),
					updatedAt: Date.now()
				};
			})
		);
		persist();
	}

	function removeTrack(id: string, index: number) {
		items = items.map((mix) =>
			mix.id === id
				? { ...mix, tracks: mix.tracks.filter((_, i) => i !== index), updatedAt: Date.now() }
				: mix
		);
		persist();
	}

	function move(id: string, from: number, to: number) {
		items = items.map((mix) => {
			if (mix.id !== id) return mix;
			if (from === to || from < 0 || to < 0 || from >= mix.tracks.length || to >= mix.tracks.length) {
				return mix;
			}
			const tracks = [...mix.tracks];
			const [moved] = tracks.splice(from, 1);
			tracks.splice(to, 0, moved);
			return { ...mix, tracks, updatedAt: Date.now() };
		});
		persist();
	}

	function byId(id: string): Mix | null {
		return items.find((mix) => mix.id === id) ?? null;
	}

	return {
		get items() {
			return items;
		},
		create,
		remove,
		rename,
		addTrack,
		addTracks,
		removeTrack,
		move,
		byId,
		hydrate
	};
}

export const mixes = createMixes();
