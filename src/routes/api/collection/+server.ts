import { error, json } from '@sveltejs/kit';
import { fetchAlbum, fetchMusicPlaylist } from '$lib/server/yt';
import type { Track } from '$lib/types';
import type { RequestHandler } from './$types';

/**
 * Load an album or playlist shelf into playable tracks.
 * `?type=album|playlist&id=…` — the ids come straight from /api/search.
 */

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const type = url.searchParams.get('type');
	const id = (url.searchParams.get('id') ?? '').trim();
	if (!id || (type !== 'album' && type !== 'playlist')) {
		throw error(400, 'Need a type (album or playlist) and an id');
	}

	let title = '';
	let subtitle = '';
	let artist = '';
	let art = '';
	let tracks: Track[] = [];

	try {
		if (type === 'album') {
			const album = await fetchAlbum(id);
			title = album.title;
			subtitle = album.subtitle;
			artist = album.artist;
			art = album.art;
			tracks = album.tracks;
		} else {
			const playlist = await fetchMusicPlaylist(id);
			title = playlist.title;
			subtitle = playlist.subtitle;
			artist = playlist.artist;
			art = playlist.art;
			tracks = playlist.tracks;
		}
	} catch {
		tracks = [];
	}

	if (!tracks.length) {
		throw error(404, `Could not load that ${type}`);
	}

	setHeaders({
		'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});
	return json({ kind: type, title, subtitle, artist, art: art || tracks[0]?.art || '', tracks });
};
