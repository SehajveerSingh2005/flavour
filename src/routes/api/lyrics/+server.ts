import { error, json } from '@sveltejs/kit';
import { memo } from '$lib/server/cache';
import { fetchLyrics } from '$lib/server/yt';
import type { RequestHandler } from './$types';

/**
 * Lyrics for the current track, straight from YouTube Music.
 * Tracks outside the music catalogue have none — that's a 404, not a failure.
 */

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const id = (url.searchParams.get('id') ?? '').trim();
	if (!/^[\w-]{11}$/.test(id)) throw error(400, 'That is not a video id');

	// misses are remembered too, so a lyric-less track isn't asked about twice
	const text = await memo(`lyrics:${id}`, () => fetchLyrics(id)).catch(() => '');
	if (!text) throw error(404, 'No lyrics for this one');

	setHeaders({
		// lyrics do not change — keep them at the edge for a day
		'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800'
	});
	return json({ lyrics: text });
};
