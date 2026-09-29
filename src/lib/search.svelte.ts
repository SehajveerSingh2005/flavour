import { browser } from '$app/environment';
import type { Collection, Track } from './types';

const RECENTS_KEY = 'flavour:recents';

function createSearch() {
	let query = $state('');
	let results = $state<Track[]>([]);
	let albums = $state<Collection[]>([]);
	let playlists = $state<Collection[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let lastQuery = $state('');
	let recents = $state<string[]>([]);

	let controller: AbortController | null = null;
	let requestId = 0;

	/** results already fetched this session, keyed by request url */
	const CACHE_MAX = 40;
	const cache = new Map<string, { tracks: Track[]; albums: Collection[]; playlists: Collection[] }>();

	function hydrate() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(RECENTS_KEY);
			if (!raw) return;
			const parsed: unknown = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				recents = parsed.filter((item): item is string => typeof item === 'string').slice(0, 8);
			}
		} catch {
			/* corrupted storage — start fresh */
		}
	}

	function remember(q: string) {
		recents = [q, ...recents.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 8);
		try {
			localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
		} catch {
			/* storage unavailable */
		}
	}

	function clearRecents() {
		recents = [];
		try {
			localStorage.removeItem(RECENTS_KEY);
		} catch {
			/* storage unavailable */
		}
	}

	interface Request {
		url: string;
		/** what the results belong to — a query or a pasted link */
		label: string;
		remember: boolean;
	}

	async function load({ url, label, remember: doRemember }: Request): Promise<Track[]> {
		controller?.abort();
		const localController = new AbortController();
		controller = localController;
		const id = ++requestId;
		error = null;
		query = label;

		// going back to a query (or retyping one) shouldn't touch the network again
		const cached = cache.get(url);
		if (cached) {
			results = cached.tracks;
			albums = cached.albums;
			playlists = cached.playlists;
			lastQuery = label;
			loading = false;
			if (results.length && doRemember) remember(label);
			return results;
		}

		loading = true;

		try {
			const res = await fetch(url, { signal: localController.signal });
			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { message?: string } | null;
				throw new Error(body?.message ?? `Request failed (${res.status})`);
			}
			const data = (await res.json()) as {
				tracks?: Track[];
				albums?: Collection[];
				playlists?: Collection[];
			};
			const payload = {
				tracks: data.tracks ?? [],
				albums: data.albums ?? [],
				playlists: data.playlists ?? []
			};
			// remember even superseded responses — the data is still right
			cache.delete(url);
			cache.set(url, payload);
			if (cache.size > CACHE_MAX) {
				const oldest = cache.keys().next().value;
				if (oldest !== undefined) cache.delete(oldest);
			}
			if (id !== requestId) return [];
			results = payload.tracks;
			albums = payload.albums;
			playlists = payload.playlists;
			lastQuery = label;
			if (results.length && doRemember) remember(label);
			return results;
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return [];
			if (id !== requestId) return [];
			error = e instanceof Error ? e.message : 'Search failed';
			return [];
		} finally {
			if (id === requestId) loading = false;
		}
	}

	/** Plain text search. */
	async function run(raw: string): Promise<Track[]> {
		const q = raw.trim();
		if (q.length < 2) return [];
		return load({
			url: `/api/search?q=${encodeURIComponent(q)}`,
			label: q,
			remember: true
		});
	}

	/** Resolve a pasted YouTube video/playlist link. */
	async function runLink(raw: string): Promise<Track[]> {
		const q = raw.trim();
		if (!q) return [];
		return load({
			url: `/api/resolve?url=${encodeURIComponent(q)}`,
			label: q,
			remember: false
		});
	}

	return {
		get query() {
			return query;
		},
		get results() {
			return results;
		},
		get albums() {
			return albums;
		},
		get playlists() {
			return playlists;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get recents() {
			return recents;
		},
		get lastQuery() {
			return lastQuery;
		},
		setQuery(q: string) {
			query = q;
		},
		clear() {
			results = [];
			albums = [];
			playlists = [];
			lastQuery = '';
			query = '';
			error = null;
		},
		run,
		runLink,
		hydrate,
		clearRecents
	};
}

export const search = createSearch();
