import { error, json } from '@sveltejs/kit';
import { memo } from '$lib/server/cache';
import { parseYouTubeLink, type YouTubeLink } from '$lib/youtube';
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

	// a failed fetch throws (and is retried); an empty result is remembered
	const result = await memo(`resolve:${link.kind}:${link.id}`, () => resolve(link)).catch(
		() => null
	);
	if (!result?.tracks.length) {
		throw error(
			404,
			link.kind === 'playlist' ? 'Could not load that playlist' : 'Could not load that video'
		);
	}

	setHeaders({
		'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});
	return json(result);
};

async function resolve(link: YouTubeLink): Promise<{ kind: string; title: string; tracks: Track[] }> {
	if (link.kind === 'playlist') {
		const playlist = await fetchPlaylist(link.id);
		return { kind: link.kind, title: playlist.title, tracks: playlist.tracks };
	}

	const track = await fetchVideo(link.id);
	return { kind: link.kind, title: '', tracks: track ? [track] : [] };
}
