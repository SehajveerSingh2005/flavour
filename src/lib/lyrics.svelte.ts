import { browser } from '$app/environment';

/**
 * Lyrics state: open/closed, the text for the current track, and a
 * session cache so flipping back to a track is instant. The API's 5-minute
 * edge cache handles repeat queries across reloads.
 */

const cache = new Map<string, string>();

function createLyrics() {
	let open = $state(false);
	let loading = $state(false);
	let text = $state('');
	let error = $state<string | null>(null);
	let shownFor = $state<string | null>(null);
	let requestId = 0;

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	async function load(id: string) {
		if (!browser || !id) return;
		if (shownFor === id && (text || error || loading)) return;
		shownFor = id;
		error = null;

		const hit = cache.get(id);
		if (hit !== undefined) {
			text = hit;
			loading = false;
			return;
		}

		const rid = ++requestId;
		loading = true;
		text = '';
		try {
			const res = await fetch(`/api/lyrics?id=${encodeURIComponent(id)}`);
			if (rid !== requestId) return;
			if (!res.ok) {
				error = res.status === 404 ? 'no lyrics for this one' : 'could not fetch lyrics';
				return;
			}
			const data = (await res.json()) as { lyrics?: string };
			const value = (data.lyrics ?? '').trim();
			if (!value) {
				error = 'no lyrics for this one';
				return;
			}
			cache.set(id, value);
			text = value;
		} catch {
			if (rid === requestId) error = 'could not fetch lyrics';
		} finally {
			if (rid === requestId) loading = false;
		}
	}

	return {
		get open() {
			return open;
		},
		get loading() {
			return loading;
		},
		get text() {
			return text;
		},
		get error() {
			return error;
		},
		toggle,
		close,
		load
	};
}

export const lyrics = createLyrics();
