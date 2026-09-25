/**
 * Minimal typings + one-time loader for the YouTube IFrame Player API.
 * We only wrap the surface FLAVOUR actually uses.
 */

export interface YTPlayer {
	playVideo(): void;
	pauseVideo(): void;
	stopVideo(): void;
	seekTo(seconds: number, allowSeekAhead: boolean): void;
	loadVideoById(videoId: string): void;
	cueVideoById(videoId: string): void;
	getCurrentTime(): number;
	getDuration(): number;
	setVolume(volume: number): void;
	mute(): void;
	unMute(): void;
	setSize(width: number, height: number): void;
	destroy(): void;
}

export interface YTPlayerEvent {
	target: YTPlayer;
	data: number;
}

export interface YTNamespace {
	Player: new (
		element: string | HTMLElement,
		options: {
			width?: number;
			height?: number;
			videoId?: string;
			playerVars?: Record<string, string | number>;
			events?: {
				onReady?: (event: YTPlayerEvent) => void;
				onStateChange?: (event: YTPlayerEvent) => void;
				onError?: (event: YTPlayerEvent) => void;
			};
		}
	) => YTPlayer;
	PlayerState: {
		UNSTARTED: -1;
		ENDED: 0;
		PLAYING: 1;
		PAUSED: 2;
		BUFFERING: 3;
		CUED: 5;
	};
}

declare global {
	interface Window {
		YT?: YTNamespace;
		onYouTubeIframeAPIReady?: () => void;
	}
}

let apiPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(): Promise<YTNamespace> {
	if (apiPromise) return apiPromise;

	apiPromise = new Promise<YTNamespace>((resolve, reject) => {
		if (typeof window === 'undefined') {
			reject(new Error('YouTube API is browser-only'));
			return;
		}
		if (window.YT?.Player) {
			resolve(window.YT);
			return;
		}
		const previous = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			previous?.();
			if (window.YT) resolve(window.YT);
			else reject(new Error('YouTube API failed to initialise'));
		};
		const script = document.createElement('script');
		script.src = 'https://www.youtube.com/iframe_api';
		script.async = true;
		script.onerror = () => reject(new Error('Could not reach youtube.com'));
		document.head.appendChild(script);
	});

	return apiPromise;
}
