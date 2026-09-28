import { error, json } from '@sveltejs/kit';
import { parseYouTubeLink } from '$lib/youtube';
import { fetchPlaylist, fetchVideo } from '$lib/server/yt';
import type { Track } from '$lib/types';
import type { RequestHandler } from './$types';

/**
 * Resolve a pasted YouTube link to playable tracks.
 * Video links give one track; playlist links give the whole list.
 */

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const raw = url.searchParams.get('url') ?? '';
	const link = parseYouTubeLink(raw);
	if (!link) throw error(400, 'Paste a YouTube video or playlist link');

	const kind = link.kind;
	let title = '';
	let tracks: Track[] = [];

	try {
		if (link.kind === 'playlist') {
			const playlist = await fetchPlaylist(link.id);
			title = playlist.title;
			tracks = playlist.tracks;
		} else {
			const track = await fetchVideo(link.id);
			if (track) tracks = [track];
		}
	} catch {
		tracks = [];
	}

	if (!tracks.length) {
		throw error(404, kind === 'playlist' ? 'Could not load that playlist' : 'Could not load that video');
	}

	setHeaders({
		'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});
	return json({ kind, title, tracks });
};
