/** 215 -> "3:35", 3674 -> "1:01:14" */
export function formatTime(totalSeconds: number): string {
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0:00';
	const s = Math.floor(totalSeconds);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Duration for list rows — unknown becomes a dash. */
export function formatDuration(totalSeconds: number): string {
	if (!totalSeconds) return '–:––';
	return formatTime(totalSeconds);
}

/** Total runtime for a list — "48 min", "1h 12m" or an em dash. */
export function formatRuntime(totalSeconds: number): string {
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';
	const minutes = Math.round(totalSeconds / 60);
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest ? `${hours}h ${String(rest).padStart(2, '0')}m` : `${hours}h`;
}

/** Bump YouTube Music art from its default 120px to something album-art sized. */
export function upscaleArt(url: string, size = 544): string {
	if (!url) return '';
	return url.replace(/w\d+-h\d+/, `w${size}-h${size}`);
}

const TITLE_NOISE =
	/\s*[([（【]\s*(?:official\s*)?(?:music\s*)?(?:video|audio|lyric(?:s)?(?:\s*video)?|visuali[sz]er|mv|m\/v|hd|hq|4k|8k|full\s*video|explicit|clean)\s*[)\]）】]\s*/gi;

/** Strip "(Official Video)", "[4K]" and friends from raw video titles. */
export function cleanTitle(raw: string): string {
	return raw
		.replace(TITLE_NOISE, ' ')
		.replace(/\s{2,}/g, ' ')
		.replace(/\s*[-–—]\s*$/, '')
		.trim();
}

/** Try to split "Artist - Song" style titles from plain YouTube results. */
export function splitArtistTitle(raw: string): { artist: string; title: string } | null {
	const cleaned = cleanTitle(raw);
	const match = cleaned.match(/^(.{2,60}?)\s+[-–—]\s+(.{2,120})$/);
	if (!match) return null;
	return { artist: match[1].trim(), title: match[2].trim() };
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
