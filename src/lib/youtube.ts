/**
 * Recognising YouTube links pasted into the search box.
 * Shared by the client (detection) and the server (resolution).
 */

export type YouTubeLink =
	| { kind: 'video'; id: string }
	| { kind: 'playlist'; id: string };

const VIDEO_ID = /^[\w-]{11}$/;
const PLAYLIST_ID = /^[\w-]{12,}$/;

const YOUTUBE_HOSTS = new Set(['youtube.com', 'music.youtube.com', 'youtu.be']);

function normaliseHost(hostname: string): string {
	return hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
}

/**
 * Parse a pasted URL. Returns null when it isn't a YouTube link.
 *
 * A `/playlist` URL loads the whole list. A watch URL with `&list=` keeps the
 * single video — sharing a song from a mix shouldn't dump a 6 hour radio into
 * the queue.
 */
export function parseYouTubeLink(raw: string): YouTubeLink | null {
	const value = raw.trim();
	if (!value) return null;

	let url: URL;
	try {
		url = new URL(value.includes('://') ? value : `https://${value}`);
	} catch {
		return null;
	}

	const host = normaliseHost(url.hostname);
	if (!YOUTUBE_HOSTS.has(host)) return null;

	const parts = url.pathname.split('/').filter(Boolean);
	const list = url.searchParams.get('list');
	const isPlaylistPage = parts[0] === 'playlist';

	if (isPlaylistPage && list && PLAYLIST_ID.test(list)) {
		return { kind: 'playlist', id: list };
	}

	let videoId: string | null = null;
	if (host === 'youtu.be') videoId = parts[0] ?? null;
	else if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') {
		videoId = parts[1] ?? null;
	} else {
		videoId = url.searchParams.get('v');
	}

	if (videoId && VIDEO_ID.test(videoId)) return { kind: 'video', id: videoId };
	if (list && PLAYLIST_ID.test(list)) return { kind: 'playlist', id: list };
	return null;
}

export function isYouTubeLink(raw: string): boolean {
	return parseYouTubeLink(raw) !== null;
}
