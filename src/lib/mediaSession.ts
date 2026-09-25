import { upscaleArt } from './format';
import type { Track } from './types';

export interface MediaSessionActions {
	play(): void;
	pause(): void;
	next(): void;
	prev(): void;
	seek(seconds: number): void;
}

function session(): MediaSession | null {
	if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return null;
	return navigator.mediaSession;
}

export function setupMediaSession(actions: MediaSessionActions) {
	const ms = session();
	if (!ms) return;
	ms.setActionHandler('play', () => actions.play());
	ms.setActionHandler('pause', () => actions.pause());
	ms.setActionHandler('nexttrack', () => actions.next());
	ms.setActionHandler('previoustrack', () => actions.prev());
	try {
		ms.setActionHandler('seekto', (details) => {
			if (typeof details.seekTime === 'number') actions.seek(details.seekTime);
		});
	} catch {
		/* some handlers are unsupported in some browsers */
	}
}

export function updateMediaMetadata(track: Track) {
	const ms = session();
	if (!ms || typeof MediaMetadata === 'undefined') return;
	const art = upscaleArt(track.art, 544);
	ms.metadata = new MediaMetadata({
		title: track.title,
		artist: track.artist,
		album: 'FLAVOUR',
		artwork: art
			? [
					{ src: art, sizes: '544x544', type: 'image/jpeg' },
					{ src: upscaleArt(track.art, 128), sizes: '128x128', type: 'image/jpeg' }
				]
			: []
	});
}

export function clearMediaMetadata() {
	const ms = session();
	if (!ms) return;
	ms.metadata = null;
	ms.playbackState = 'none';
}

export function updatePositionState(position: number, duration: number) {
	const ms = session();
	if (!ms?.setPositionState) return;
	if (!Number.isFinite(duration) || duration <= 0) return;
	try {
		ms.setPositionState({
			duration,
			position: Math.min(Math.max(position, 0), duration),
			playbackRate: 1
		});
	} catch {
		/* transient values can still throw; safe to ignore */
	}
}

export function setPlaybackState(state: MediaSessionPlaybackState) {
	const ms = session();
	if (!ms) return;
	ms.playbackState = state;
}
