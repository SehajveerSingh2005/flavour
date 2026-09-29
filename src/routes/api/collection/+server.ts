import { error, json } from '@sveltejs/kit';
import { memo } from '$lib/server/cache';
import { fetchAlbum, fetchMusicPlaylist } from '$lib/server/yt';
import type { Track } from '$lib/types';
import type { RequestHandler } from './$types';

/**
 * Load an album or playlist shelf into playable tracks.
 * `?type=album|playlist&id=…` — the ids come straight from /api/search.
 */

interface CollectionPayload {
	kind: string;
	title: string;
	subtitle: string;
	artist: string;
	art: string;
	tracks: Track[];
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const type = url.searchParams.get('type');
	const id = (url.searchParams.get('id') ?? '').trim();
	if (!id || (type !== 'album' && type !== 'playlist')) {
		throw error(400, 'Need a type (album or playlist) and an id');
	}

	// failed fetches are thrown straight through — the memo only keeps results
	const result = await memo(`collection:${type}:${id}`, () => load(type, id)).catch(() => null);
	if (!result?.tracks.length) throw error(404, `Could not load that ${type}`);

	setHeaders({
		'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});
	return json(result);
};

async function load(type: 'album' | 'playlist', id: string): Promise<CollectionPayload> {
	if (type === 'album') {
		const album = await fetchAlbum(id);
		return {
			kind: type,
			title: album.title,
			subtitle: album.subtitle,
			artist: album.artist,
			art: album.art || album.tracks[0]?.art || '',
			tracks: album.tracks
		};
	}

	const playlist = await fetchMusicPlaylist(id);
	return {
		kind: type,
		title: playlist.title,
		subtitle: playlist.subtitle,
		artist: playlist.artist,
		art: playlist.art || playlist.tracks[0]?.art || '',
		tracks: playlist.tracks
	};
}
