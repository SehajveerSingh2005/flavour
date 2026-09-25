import { error, json } from '@sveltejs/kit';
import { Innertube } from 'youtubei.js';
import { cleanTitle, splitArtistTitle, upscaleArt } from '$lib/format';
import type { Track } from '$lib/types';
import type { RequestHandler } from './$types';

/**
 * Keyless search proxy.
 *
 * Primary source: YouTube Music (WEB_REMIX) search — gives clean artist names,
 * durations and square album art. Fallback: regular YouTube video search for
 * the long tail that the music catalogue doesn't cover.
 */

let innertube: Promise<Innertube> | null = null;

function getInnertube(): Promise<Innertube> {
	// retrieve_player:false skips downloading the player script — we only search.
	innertube ??= Innertube.create({ lang: 'en', location: 'US', retrieve_player: false });
	return innertube;
}

interface MusicItemLike {
	id?: string;
	title?: string;
	duration?: { seconds?: number };
	artists?: Array<{ name?: string }>;
	author?: { name?: string };
	thumbnail?: { contents?: Array<{ url?: string }>; url?: string };
}

interface VideoItemLike {
	id?: string;
	video_id?: string;
	title?: string | { text?: string };
	author?: { name?: string };
	duration?: { seconds?: number };
	thumbnails?: Array<{ url?: string }>;
}

function fromMusicItem(item: MusicItemLike): Track | null {
	if (!item.id) return null;
	const artist =
		item.artists
			?.map((a) => a.name)
			.filter(Boolean)
			.join(', ') ||
		item.author?.name ||
		'Unknown artist';
	const art = item.thumbnail?.contents?.[0]?.url ?? item.thumbnail?.url ?? '';
	return {
		id: item.id,
		title: cleanTitle(item.title ?? 'Untitled'),
		artist,
		duration: Math.round(item.duration?.seconds ?? 0),
		art: upscaleArt(art),
		source: 'music'
	};
}

function fromVideoItem(item: VideoItemLike): Track | null {
	const id = item.id ?? item.video_id;
	if (!id) return null;
	const rawTitle = typeof item.title === 'string' ? item.title : (item.title?.text ?? 'Untitled');
	const split = splitArtistTitle(rawTitle);
	const author = item.author?.name ?? '';
	return {
		id,
		title: split ? split.title : cleanTitle(rawTitle),
		artist: split ? split.artist : author || 'YouTube',
		duration: Math.round(item.duration?.seconds ?? 0),
		art: item.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
		source: 'video'
	};
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	if (q.length < 2) throw error(400, 'Type at least two characters');
	if (q.length > 140) throw error(400, 'That query is too long');

	const yt = await getInnertube();
	const tracks: Track[] = [];
	const seen = new Set<string>();

	try {
		const music = await yt.music.search(q, { type: 'song' });
		const items = (music.songs?.contents ?? []) as unknown as MusicItemLike[];
		for (const item of items) {
			const track = fromMusicItem(item);
			if (track && !seen.has(track.id)) {
				seen.add(track.id);
				tracks.push(track);
			}
		}
	} catch {
		/* music search can fail on rare queries — the video fallback below covers us */
	}

	if (tracks.length < 8) {
		try {
			const videos = await yt.search(q, { type: 'video' });
			const items = (videos.videos ?? []) as unknown as VideoItemLike[];
			for (const item of items) {
				const track = fromVideoItem(item);
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

	if (!tracks.length) throw error(404, 'Nothing found for that');

	setHeaders({
		// popular searches get cached at the edge — faster and lighter on YouTube
		'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});
	return json({ tracks: tracks.slice(0, 24) });
};
