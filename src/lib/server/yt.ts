import { Innertube } from 'youtubei.js';
import { cleanTitle, splitArtistTitle, upscaleArt } from '$lib/format';
import type { Collection, Track } from '$lib/types';

/**
 * One shared Innertube client for every server route.
 *
 * `retrieve_player: false` skips downloading YouTube's player script — we only
 * ever read metadata, never stream.
 */

let innertube: Promise<Innertube> | null = null;

export function getInnertube(): Promise<Innertube> {
	innertube ??= Innertube.create({ lang: 'en', location: 'US', retrieve_player: false });
	return innertube;
}

/* ---------- loose shapes for the bits of the API we touch ---------- */

export interface MusicItemLike {
	id?: string;
	title?: string;
	duration?: { seconds?: number };
	artists?: Array<{ name?: string }>;
	author?: { name?: string };
	thumbnail?: { contents?: Array<{ url?: string }>; url?: string };
}

export interface VideoItemLike {
	id?: string;
	video_id?: string;
	title?: string | { text?: string };
	author?: { name?: string };
	duration?: { seconds?: number };
	thumbnails?: Array<{ url?: string }>;
}

interface PanelItemLike {
	video_id?: string;
	title?: { text?: string } | string;
	author?: string;
	album?: { name?: string };
	artists?: Array<{ name?: string }>;
	duration?: { seconds?: number };
	thumbnail?: Array<{ url?: string }>;
	primary?: PanelItemLike | null;
}

interface PlaylistItemLike {
	id?: string;
	title?: { text?: string } | string;
	author?: { name?: string };
	thumbnails?: Array<{ url?: string }>;
	duration?: { seconds?: number };
	is_live?: boolean;
}

/**
 * `getPlaylist` hands back `PlaylistVideo` nodes on some layouts and
 * `LockupView` nodes on others — this covers the fields of both.
 */
interface PlaylistEntryLike extends PlaylistItemLike {
	type?: string;
	content_id?: string;
	content_type?: string;
	content_image?: {
		image?: ThumbnailLike[];
		overlays?: Array<{ badges?: Array<{ text?: string }> }>;
	};
	metadata?: {
		title?: { text?: string };
		metadata?: { metadata_rows?: Array<{ metadata_parts?: Array<{ text?: { text?: string } }> }> };
	};
}

interface ThumbnailLike {
	url?: string;
	width?: number;
	height?: number;
}

/** Album/playlist cards from a music search — `MusicTwoRowItem` nodes */
export interface TwoRowItemLike {
	id?: string;
	title?: string;
	subtitle?: { text?: string } | string;
	year?: string;
	item_count?: number | string;
	author?: { name?: string };
	thumbnail?: { contents?: ThumbnailLike[] } | ThumbnailLike[];
}

/** Tracks on an album/playlist page — `MusicResponsiveListItem` nodes */
export interface ResponsiveItemLike {
	id?: string;
	title?: string;
	duration?: { seconds?: number };
	thumbnail?: { contents?: ThumbnailLike[] } | ThumbnailLike[];
	artists?: Array<{ name?: string }>;
	authors?: Array<{ name?: string }>;
	author?: { name?: string };
	subtitle?: { text?: string } | string;
}

function textOf(value: unknown): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') {
		const text = (value as { text?: unknown }).text;
		if (typeof text === 'string') return text;
	}
	return '';
}

function thumbFrom(value: unknown): string {
	if (!value) return '';
	if (Array.isArray(value)) return bestThumb(value as ThumbnailLike[]);
	const shaped = value as { contents?: ThumbnailLike[]; url?: string };
	return bestThumb(shaped.contents) || shaped.url || '';
}

/* ---------- mappers ---------- */

export function fromMusicItem(item: MusicItemLike): Track | null {
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

export function fromVideoItem(item: VideoItemLike): Track | null {
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

function fromPanelItem(item: PanelItemLike): Track | null {
	const id = item.video_id;
	if (!id) return null;
	const title = typeof item.title === 'string' ? item.title : (item.title?.text ?? 'Untitled');
	const artist =
		item.artists
			?.map((a) => a.name)
			.filter(Boolean)
			.join(', ') ||
		item.author ||
		item.album?.name ||
		'Unknown artist';
	return {
		id,
		title: cleanTitle(title),
		artist,
		duration: Math.round(item.duration?.seconds ?? 0),
		art: upscaleArt(item.thumbnail?.[0]?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`),
		source: 'music'
	};
}

function fromPlaylistItem(item: PlaylistItemLike): Track | null {
	if (!item.id || item.is_live) return null;
	const title = typeof item.title === 'string' ? item.title : (item.title?.text ?? 'Untitled');
	return {
		id: item.id,
		title: cleanTitle(title),
		artist: item.author?.name ?? 'YouTube',
		duration: Math.round(item.duration?.seconds ?? 0),
		art: upscaleArt(item.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`),
		source: 'video'
	};
}

/** "5:04" / "1:02:33" → seconds */
function parseClock(text?: string): number {
	if (!text) return 0;
	const parts = text.trim().split(':');
	if (!parts.length || parts.some((p) => !/^\d+$/.test(p))) return 0;
	return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

function fromLockupItem(item: PlaylistEntryLike): Track | null {
	if (item.content_type && item.content_type !== 'VIDEO') return null;
	const id = item.content_id;
	if (!id) return null;
	const title = item.metadata?.title?.text ?? 'Untitled';
	const author = item.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text;
	const duration = item.content_image?.overlays?.[0]?.badges?.[0]?.text;
	const art =
		[...(item.content_image?.image ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ??
		'';
	return {
		id,
		title: cleanTitle(title),
		artist: author || 'YouTube',
		duration: parseClock(duration),
		art: upscaleArt(art || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`),
		source: 'video'
	};
}

function fromPlaylistEntry(item: PlaylistEntryLike): Track | null {
	if (item.type === 'LockupView') return fromLockupItem(item);
	return fromPlaylistItem(item);
}

function bestThumb(thumbnails?: ThumbnailLike[]): string {
	if (!thumbnails?.length) return '';
	return [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? '';
}

/* ---------- albums + playlists ---------- */

export function toCollection(item: TwoRowItemLike | undefined, kind: 'album' | 'playlist'): Collection | null {
	if (!item?.id) return null;
	const count =
		typeof item.item_count === 'number' || typeof item.item_count === 'string'
			? String(item.item_count)
			: '';
	const subtitle =
		textOf(item.subtitle) ||
		item.author?.name ||
		item.year ||
		(count ? `${count} tracks` : '');
	return {
		id: item.id,
		kind,
		title: item.title ?? 'Untitled',
		subtitle,
		art: upscaleArt(thumbFrom(item.thumbnail))
	};
}

function fromResponsiveItem(item: ResponsiveItemLike, fallbackArtist = ''): Track | null {
	if (!item?.id) return null;
	const title = typeof item.title === 'string' && item.title ? item.title : 'Untitled';
	const artist =
		item.artists?.map((a) => a.name).filter(Boolean).join(', ') ||
		item.authors?.map((a) => a.name).filter(Boolean).join(', ') ||
		item.author?.name ||
		textOf(item.subtitle) ||
		fallbackArtist ||
		'Unknown artist';
	return {
		id: item.id,
		title: cleanTitle(title),
		artist,
		duration: Math.round(item.duration?.seconds ?? 0),
		art: upscaleArt(thumbFrom(item.thumbnail) || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`),
		source: 'music'
	};
}

interface HeaderLike {
	title?: { text?: string };
	subtitle?: { text?: string };
	second_subtitle?: { text?: string };
}

function headerInfo(header: unknown): { title: string; subtitle: string } {
	const shaped = (header ?? {}) as HeaderLike;
	return {
		title: textOf(shaped.title) || 'Untitled',
		subtitle: textOf(shaped.subtitle) || textOf(shaped.second_subtitle)
	};
}

function collectTracks(items: unknown[], fallbackArtist: string, limit: number): Track[] {
	const tracks: Track[] = [];
	const seen = new Set<string>();
	for (const raw of items) {
		const track = fromResponsiveItem(raw as ResponsiveItemLike, fallbackArtist);
		if (track && !seen.has(track.id)) {
			seen.add(track.id);
			tracks.push(track);
		}
		if (tracks.length >= limit) break;
	}
	return tracks;
}

/* ---------- fetchers ---------- */

/** YouTube Music "up next" — the seed of the endless radio. */
export async function fetchRadio(videoId: string): Promise<Track[]> {
	const yt = await getInnertube();
	const panel = await yt.music.getUpNext(videoId, true);
	const tracks: Track[] = [];
	const seen = new Set<string>([videoId]);
	for (const raw of panel.contents as unknown as PanelItemLike[]) {
		const item = raw?.primary ?? raw;
		const track = item ? fromPanelItem(item) : null;
		if (track && !seen.has(track.id)) {
			seen.add(track.id);
			tracks.push(track);
		}
	}
	return tracks;
}

/** Metadata for a single pasted video link. */
export async function fetchVideo(id: string): Promise<Track | null> {
	const yt = await getInnertube();
	const info = await yt.getBasicInfo(id);
	const basic = info.basic_info;
	if (!basic?.title) return null;
	const split = splitArtistTitle(basic.title);
	const art = bestThumb(basic.thumbnail) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
	return {
		id: basic.id ?? id,
		title: split ? split.title : cleanTitle(basic.title),
		artist: split ? split.artist : basic.author || 'YouTube',
		duration: Math.round(basic.duration ?? 0),
		art: upscaleArt(art),
		source: 'video'
	};
}

/** A pasted playlist link — first page is plenty (up to ~100 tracks). */
export async function fetchPlaylist(id: string, limit = 100): Promise<{ title: string; tracks: Track[] }> {
	const yt = await getInnertube();
	const playlist = await yt.getPlaylist(id);
	const tracks: Track[] = [];
	const seen = new Set<string>();
	for (const raw of playlist.items as unknown as PlaylistEntryLike[]) {
		const track = fromPlaylistEntry(raw);
		if (track && !seen.has(track.id)) {
			seen.add(track.id);
			tracks.push(track);
		}
		if (tracks.length >= limit) break;
	}
	return { title: playlist.info.title ?? 'Playlist', tracks };
}

/** An album from a browse shelf — its header plus every track. */
export async function fetchAlbum(id: string): Promise<{ title: string; subtitle: string; tracks: Track[] }> {
	const yt = await getInnertube();
	const album = await yt.music.getAlbum(id);
	const { title, subtitle } = headerInfo(album.header);
	const tracks = collectTracks(album.contents ?? [], '', 200);
	return { title, subtitle, tracks };
}

/** A music playlist from a browse shelf. */
export async function fetchMusicPlaylist(
	id: string,
	limit = 100
): Promise<{ title: string; subtitle: string; tracks: Track[] }> {
	const yt = await getInnertube();
	const playlist = await yt.music.getPlaylist(id.replace(/^VL/, ''));
	const { title, subtitle } = headerInfo(playlist.header);
	const tracks = collectTracks(playlist.items ?? [], '', limit);
	return { title, subtitle, tracks };
}
