import { browser } from '$app/environment';
import type { Track } from './types';

const RECENTS_KEY = 'flavour:recents';

function createSearch() {
	let query = $state('');
	let results = $state<Track[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let lastQuery = $state('');
	let recents = $state<string[]>([]);

	let controller: AbortController | null = null;
	let requestId = 0;

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

	async function run(raw: string): Promise<Track[]> {
		const q = raw.trim();
		if (q.length < 2) return [];
		controller?.abort();
		const localController = new AbortController();
		controller = localController;
		const id = ++requestId;
		loading = true;
		error = null;
		query = q;

		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
				signal: localController.signal
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { message?: string } | null;
				throw new Error(body?.message ?? `Search failed (${res.status})`);
			}
			const data = (await res.json()) as { tracks?: Track[] };
			if (id !== requestId) return [];
			results = data.tracks ?? [];
			lastQuery = q;
			if (results.length) remember(q);
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

	return {
		get query() {
			return query;
		},
		get results() {
			return results;
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
			lastQuery = '';
			query = '';
			error = null;
		},
		run,
		hydrate
	};
}

export const search = createSearch();
