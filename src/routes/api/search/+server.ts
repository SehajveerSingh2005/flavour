import { error, json } from '@sveltejs/kit';
import { memo } from '$lib/server/cache';
import {
	fromMusicItem,
	fromVideoItem,
	getInnertube,
	toCollection,
	type MusicItemLike,
	type TwoRowItemLike,
	type VideoItemLike
} from '$lib/server/yt';
import type { Collection, Track } from '$lib/types';
import type { RequestHandler } from './$types';

/**
 * Keyless search proxy.
 *
 * YouTube Music (WEB_REMIX) gives clean artist names, durations, square album
 * art, and the album/playlist shelves. A regular YouTube video search covers
 * the long tail the music catalogue misses.
 */

interface SearchPayload {
	tracks: Track[];
	albums: Collection[];
	playlists: Collection[];
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	if (q.length < 2) throw error(400, 'Type at least two characters');
	if (q.length > 140) throw error(400, 'That query is too long');

	// YouTube is case-insensitive — normalising the key makes the in-process
	// memo (and the edge cache) hit for "The Weeknd" and "the weeknd" alike
	const key = q.toLowerCase().replace(/\s+/g, ' ');
	const result = await memo(`search:${key}`, () => search(q));

	if (!result.tracks.length && !result.albums.length && !result.playlists.length) {
		throw error(404, 'Nothing found for that');
	}

	setHeaders({
		// popular searches get cached at the edge — faster and lighter on YouTube
		'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});
	return json(result);
};

async function search(q: string): Promise<SearchPayload> {
	const yt = await getInnertube();
	const tracks: Track[] = [];
	const albums: Collection[] = [];
	const playlists: Collection[] = [];
	const seen = new Set<string>();

	const [songs, albumSearch, playlistSearch] = await Promise.allSettled([
		yt.music.search(q, { type: 'song' }),
		yt.music.search(q, { type: 'album' }),
		yt.music.search(q, { type: 'playlist' })
	]);

	if (songs.status === 'fulfilled') {
		for (const item of songs.value.songs?.contents ?? []) {
			const track = fromMusicItem(item as unknown as MusicItemLike);
			if (track && !seen.has(track.id)) {
				seen.add(track.id);
				tracks.push(track);
			}
		}
	}

	if (albumSearch.status === 'fulfilled') {
		for (const item of albumSearch.value.albums?.contents ?? []) {
			const album = toCollection(item as unknown as TwoRowItemLike, 'album');
			if (album) albums.push(album);
			if (albums.length >= 8) break;
		}
	}

	if (playlistSearch.status === 'fulfilled') {
		for (const item of playlistSearch.value.playlists?.contents ?? []) {
			const playlist = toCollection(item as unknown as TwoRowItemLike, 'playlist');
			if (playlist) playlists.push(playlist);
			if (playlists.length >= 8) break;
		}
	}

	if (tracks.length < 8) {
		try {
			const videos = await yt.search(q, { type: 'video' });
			for (const item of videos.videos ?? []) {
				const track = fromVideoItem(item as unknown as VideoItemLike);
				if (track && !seen.has(track.id)) {
					seen.add(track.id);
					tracks.push(track);
				}
				if (tracks.length >= 24) break;
			}
		} catch {
			/* keep whatever the music search returned */
		}
	}

	return { tracks: tracks.slice(0, 24), albums, playlists };
}
