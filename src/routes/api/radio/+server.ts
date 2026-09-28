import { error, json } from '@sveltejs/kit';
import { fetchRadio } from '$lib/server/yt';
import type { Track } from '$lib/types';
import type { RequestHandler } from './$types';

/**
 * Autoplay radio — YouTube Music's "up next" for the current video.
 * The client appends these when the queue runs out (or on demand).
 */

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const id = (url.searchParams.get('id') ?? '').trim();
	if (!/^[\w-]{11}$/.test(id)) throw error(400, 'That is not a video id');

	let tracks: Track[] = [];
	try {
		tracks = await fetchRadio(id);
	} catch {
		tracks = [];
	}
	if (!tracks.length) throw error(404, 'No radio for this one');

	setHeaders({
		'cache-control': 'public, s-maxage=1800, stale-while-revalidate=86400'
	});
	return json({ tracks: tracks.slice(0, 30) });
};
