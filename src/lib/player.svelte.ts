import { browser } from '$app/environment';
import { clamp } from './format';
import { history } from './history.svelte';
import {
	clearMediaMetadata,
	setPlaybackState,
	setupMediaSession,
	updateMediaMetadata,
	updatePositionState
} from './mediaSession';
import { toasts } from './toasts.svelte';
import type { PlayerStatus, QueueItem, RepeatMode, Track } from './types';
import { loadYouTubeApi, type YTNamespace, type YTPlayer } from './yt/loader';

const QUEUE_KEY = 'flavour:queue';
const SETTINGS_KEY = 'flavour:settings';
const HOST_ID = 'yt-host';
const HIDDEN_SIZE = { width: 320, height: 180 };
const THEATRE_SIZE = { width: 1280, height: 720 };

interface PersistedQueue {
	tracks: QueueItem[];
	index: number;
}

interface PersistedSettings {
	volume: number;
	muted: boolean;
	shuffle: boolean;
	repeat: RepeatMode;
	radio: boolean;
}

function uid(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeItem(track: Track): QueueItem {
	return { ...track, uid: uid() };
}

/** Validate persisted data before trusting it. */
function toItem(value: unknown): QueueItem | null {
	if (!value || typeof value !== 'object') return null;
	const t = value as Record<string, unknown>;
	if (typeof t.id !== 'string' || typeof t.title !== 'string') return null;
	return {
		id: t.id,
		title: t.title,
		artist: typeof t.artist === 'string' ? t.artist : 'Unknown artist',
		duration: typeof t.duration === 'number' ? t.duration : 0,
		art: typeof t.art === 'string' ? t.art : '',
		source: t.source === 'video' ? 'video' : 'music',
		uid: typeof t.uid === 'string' ? t.uid : uid()
	};
}

function createPlayer() {
	/* ---------- reactive state ---------- */
	let queue = $state<QueueItem[]>([]);
	let index = $state(-1);
	let status = $state<PlayerStatus>('idle');
	let position = $state(0);
	let duration = $state(0);
	let volume = $state(0.7);
	let muted = $state(false);
	let shuffle = $state(false);
	let repeat = $state<RepeatMode>('off');
	let radio = $state(true);
	let refilling = $state(false);
	let immersive = $state(false);
	let apiReady = $state(false);
	let mountError = $state<string | null>(null);

	/* ---------- internals (not reactive) ---------- */
	let yt: YTPlayer | null = null;
	let YT: YTNamespace | null = null;
	let tick: ReturnType<typeof setInterval> | null = null;
	let loadedId: string | null = null;
	let pendingPlay = false;
	let mounted = false;

	const current = $derived(index >= 0 && index < queue.length ? queue[index] : null);
	const progress = $derived(duration > 0 ? clamp(position / duration, 0, 1) : 0);
	const isPlaying = $derived(status === 'playing' || status === 'buffering');

	/* ---------- persistence ---------- */
	function persistQueue() {
		if (!browser) return;
		try {
			const payload: PersistedQueue = { tracks: queue, index };
			localStorage.setItem(QUEUE_KEY, JSON.stringify(payload));
		} catch {
			/* storage full or unavailable */
		}
	}

	function persistSettings() {
		if (!browser) return;
		try {
			const payload: PersistedSettings = { volume, muted, shuffle, repeat, radio };
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
		} catch {
			/* storage full or unavailable */
		}
	}

	function hydrate() {
		if (!browser) return;
		try {
			const rawQueue = localStorage.getItem(QUEUE_KEY);
			if (rawQueue) {
				const parsed = JSON.parse(rawQueue) as { tracks?: unknown; index?: unknown };
				const tracks = Array.isArray(parsed.tracks)
					? parsed.tracks.map(toItem).filter((t): t is QueueItem => t !== null)
					: [];
				if (tracks.length) {
					queue = tracks;
					const i = typeof parsed.index === 'number' ? parsed.index : 0;
					index = clamp(Math.round(i), 0, tracks.length - 1);
				}
			}
			const rawSettings = localStorage.getItem(SETTINGS_KEY);
			if (rawSettings) {
				const s = JSON.parse(rawSettings) as Partial<PersistedSettings>;
				if (typeof s.volume === 'number') volume = clamp(s.volume, 0, 1);
				muted = !!s.muted;
				shuffle = !!s.shuffle;
				radio = s.radio === undefined ? true : !!s.radio;
				if (s.repeat === 'off' || s.repeat === 'all' || s.repeat === 'one') repeat = s.repeat;
			}
		} catch {
			/* corrupted storage — start fresh */
		}
	}

	/* ---------- ticking clock ---------- */
	function startTick() {
		if (tick) return;
		tick = setInterval(() => {
			if (!yt) return;
			const t = yt.getCurrentTime();
			if (Number.isFinite(t)) position = t;
			const d = yt.getDuration();
			if (Number.isFinite(d) && d > 0 && Math.abs(d - duration) > 0.5) duration = d;
			updatePositionState(position, duration);
		}, 250);
	}

	function stopTick() {
		if (tick) {
			clearInterval(tick);
			tick = null;
		}
	}

	/* ---------- playback plumbing ---------- */
	function loadCurrent(autoplay: boolean) {
		const track = current;
		if (!track) return;
		position = 0;
		duration = track.duration || 0;
		loadedId = track.id;
		updateMediaMetadata(track);
		history.record(track);

		if (!yt || !apiReady) {
			pendingPlay = autoplay;
			return;
		}
		pendingPlay = false;
		status = 'loading';
		if (autoplay) yt.loadVideoById(track.id);
		else yt.cueVideoById(track.id);
	}

	function resume() {
		const track = current;
		if (!track) return;
		if (yt && apiReady) {
			if (loadedId !== track.id) {
				loadCurrent(true);
				return;
			}
			if (status !== 'playing' && status !== 'buffering') {
				status = 'loading';
				yt.playVideo();
			}
		} else {
			loadCurrent(true);
		}
	}

	function pauseAction() {
		if (status === 'playing' || status === 'buffering') {
			yt?.pauseVideo();
			status = 'paused';
			stopTick();
			setPlaybackState('paused');
		}
	}

	function togglePlay() {
		if (isPlaying) {
			pauseAction();
		} else {
			resume();
		}
	}

	function onEnded() {
		stopTick();
		if (repeat === 'one') {
			seek(0);
			resume();
			return;
		}
		next(true);
	}

	function handleState(state: number) {
		if (state === 1) {
			status = 'playing';
			startTick();
			setPlaybackState('playing');
		} else if (state === 2) {
			status = 'paused';
			stopTick();
			setPlaybackState('paused');
		} else if (state === 3) {
			status = 'buffering';
			startTick();
		} else if (state === 0) {
			status = 'paused';
			onEnded();
		} else if (state === 5) {
			status = 'paused';
			const d = yt?.getDuration();
			if (d && d > 0) duration = d;
		}
	}

	function skipUnavailable(reason: string) {
		const track = current;
		toasts.push(
			track ? `Skipping “${track.title}” — ${reason}` : `Playback error — ${reason}`,
			'error'
		);
		stopTick();
		status = 'paused';
		if (queue.length > 1 && index < queue.length - 1) {
			setTimeout(() => next(true), 800);
		}
	}

	function handleError(code: number) {
		const reasons: Record<number, string> = {
			2: 'bad video id',
			5: 'this browser can’t play it',
			100: 'video not found',
			101: 'embedding disabled by the uploader',
			150: 'embedding disabled by the uploader'
		};
		skipUnavailable(reasons[code] ?? `error ${code}`);
	}

	/* ---------- mount ---------- */
	async function mount(hostId: string = HOST_ID) {
		if (!browser || mounted) return;
		mounted = true;
		hydrate();
		setupMediaSession({
			play: resume,
			pause: pauseAction,
			next: () => next(),
			prev: () => prev(),
			seek: (seconds) => seek(seconds)
		});

		try {
			YT = await loadYouTubeApi();
			yt = new YT.Player(hostId, {
				width: HIDDEN_SIZE.width,
				height: HIDDEN_SIZE.height,
				playerVars: {
					autoplay: 0,
					controls: 0,
					disablekb: 1,
					fs: 0,
					iv_load_policy: 3,
					modestbranding: 1,
					playsinline: 1,
					rel: 0,
					origin: location.origin
				},
				events: {
					onReady: () => {
						apiReady = true;
						yt?.setVolume(Math.round(volume * 100));
						if (muted) yt?.mute();
						const track = current;
						if (track) {
							loadedId = track.id;
							updateMediaMetadata(track);
							if (pendingPlay) {
								pendingPlay = false;
								status = 'loading';
								yt?.loadVideoById(track.id);
							} else {
								yt?.cueVideoById(track.id);
							}
						}
					},
					onStateChange: (event) => handleState(event.data),
					onError: (event) => handleError(event.data)
				}
			});
		} catch (error) {
			mountError = error instanceof Error ? error.message : 'Could not load the player';
			toasts.push('YouTube player failed to load — playback unavailable', 'error', 6000);
		}
	}

	/* ---------- transport ---------- */
	function playNow(track: Track, list?: Track[]) {
		if (list && list.length) {
			queue = list.map(makeItem);
			const at = queue.findIndex((t) => t.id === track.id);
			index = at >= 0 ? at : 0;
		} else {
			const at = queue.findIndex((t) => t.id === track.id);
			if (at >= 0) {
				index = at;
			} else {
				queue = [...queue, makeItem(track)];
				index = queue.length - 1;
			}
		}
		loadCurrent(true);
		persistQueue();
	}

	function playAt(i: number) {
		if (i < 0 || i >= queue.length) return;
		index = i;
		loadCurrent(true);
		persistQueue();
	}

	function next(auto = false) {
		if (!queue.length) return;
		if (shuffle && queue.length > 1) {
			let n = index;
			while (n === index) n = Math.floor(Math.random() * queue.length);
			index = n;
			loadCurrent(true);
			persistQueue();
			return;
		}
		let n = index + 1;
		if (n >= queue.length) {
			if (repeat === 'all') {
				n = 0;
			} else if (auto && radio) {
				// queue over — let YouTube's up-next refill it and keep rolling
				void growAndAdvance();
				return;
			} else if (auto) {
				status = 'paused';
				return;
			} else {
				n = 0;
			}
		}
		index = n;
		loadCurrent(true);
		persistQueue();
	}

	/** Pull fresh tracks from the radio for the current video. */
	async function refillQueue(seedId?: string): Promise<boolean> {
		const id = seedId ?? current?.id;
		if (!id || refilling) return false;
		refilling = true;
		try {
			const res = await fetch(`/api/radio?id=${encodeURIComponent(id)}`);
			if (!res.ok) return false;
			const data = (await res.json()) as { tracks?: Track[] };
			const known = new Set(queue.map((t) => t.id));
			const fresh = (data.tracks ?? []).filter((t) => t.id !== id && !known.has(t.id));
			if (!fresh.length) return false;
			queue = [...queue, ...fresh.map(makeItem)];
			persistQueue();
			toasts.push(`Radio lined up ${fresh.length} more`, 'accent');
			return true;
		} catch {
			return false;
		} finally {
			refilling = false;
		}
	}

	/** Called when a track ends and the queue is spent. */
	async function growAndAdvance() {
		const seed = current;
		if (!seed) {
			status = 'paused';
			return;
		}
		status = 'buffering';
		const ok = await refillQueue(seed.id);
		// the listener may have skipped (or paused) while we were fetching
		const stillBuffering = () => status === 'buffering';
		if (current?.uid !== seed.uid) return;
		if (!ok) {
			status = 'paused';
			toasts.push('Radio came up empty — the queue is done', 'error');
			return;
		}
		if (!stillBuffering()) return;
		const at = queue.findIndex((t) => t.uid === seed.uid);
		index = at + 1 < queue.length ? at + 1 : 0;
		loadCurrent(true);
		persistQueue();
	}

	function prev() {
		if (position > 4) {
			seek(0);
			return;
		}
		let p = index - 1;
		if (p < 0) p = repeat === 'all' ? queue.length - 1 : 0;
		index = p;
		loadCurrent(true);
		persistQueue();
	}

	function seek(seconds: number) {
		const d = duration || yt?.getDuration() || 0;
		const target = d > 0 ? clamp(seconds, 0, d) : Math.max(0, seconds);
		if (yt && apiReady) yt.seekTo(target, true);
		position = target;
		updatePositionState(position, duration);
	}

	function setVolume(v: number) {
		volume = clamp(v, 0, 1);
		if (yt && apiReady) {
			yt.setVolume(Math.round(volume * 100));
			if (volume > 0 && muted) {
				muted = false;
				yt.unMute();
			}
		}
		persistSettings();
	}

	function toggleMute() {
		muted = !muted;
		if (yt && apiReady) {
			if (muted) yt.mute();
			else yt.unMute();
		}
		persistSettings();
	}

	function toggleShuffle() {
		shuffle = !shuffle;
		persistSettings();
		toasts.push(shuffle ? 'Shuffle on' : 'Shuffle off');
	}

	function cycleRepeat() {
		repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
		persistSettings();
		toasts.push(repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat queue' : 'Repeat one');
	}

	function toggleRadio() {
		radio = !radio;
		persistSettings();
		toasts.push(radio ? 'Autoplay radio on' : 'Autoplay radio off');
	}

	/* ---------- queue editing ---------- */
	function addToQueue(track: Track) {
		queue = [...queue, makeItem(track)];
		if (index < 0) index = 0;
		persistQueue();
		toasts.push(`Added “${track.title}” to queue`, 'accent');
	}

	function addNext(track: Track) {
		const at = index < 0 ? queue.length : index + 1;
		queue = [...queue.slice(0, at), makeItem(track), ...queue.slice(at)];
		if (index < 0) index = 0;
		persistQueue();
		toasts.push(`“${track.title}” plays next`, 'accent');
	}

	function removeAt(i: number) {
		if (i < 0 || i >= queue.length) return;
		const wasCurrent = i === index;
		const nextQueue = [...queue];
		nextQueue.splice(i, 1);
		queue = nextQueue;
		if (!nextQueue.length) {
			clearPlayback();
			index = -1;
		} else if (i < index) {
			index -= 1;
		} else if (wasCurrent) {
			index = Math.min(index, nextQueue.length - 1);
			loadCurrent(isPlaying);
		}
		persistQueue();
	}

	function move(from: number, to: number) {
		if (to < 0 || to >= queue.length || from === to) return;
		const nextQueue = [...queue];
		const [item] = nextQueue.splice(from, 1);
		nextQueue.splice(to, 0, item);
		const currentUid = current?.uid;
		queue = nextQueue;
		if (currentUid) {
			const at = queue.findIndex((t) => t.uid === currentUid);
			if (at >= 0) index = at;
		}
		persistQueue();
	}

	/** Slot a queued track directly after the one playing now. */
	function moveToNext(from: number) {
		if (from === index) return;
		const to = from < index ? index : index + 1;
		move(from, to);
	}

	/** Jump a queued track to the front of the queue. */
	function moveToTop(from: number) {
		if (from === index || from === 0) return;
		move(from, 0);
	}

	function clearQueue() {
		queue = [];
		index = -1;
		clearPlayback();
		persistQueue();
		toasts.push('Queue cleared');
	}

	function clearPlayback() {
		yt?.stopVideo();
		stopTick();
		status = 'idle';
		position = 0;
		duration = 0;
		loadedId = null;
		setPlaybackState('none');
		clearMediaMetadata();
	}

	/* ---------- immersive ---------- */
	function setImmersive(value: boolean) {
		immersive = value;
		if (yt && apiReady) {
			const size = value ? THEATRE_SIZE : HIDDEN_SIZE;
			yt.setSize(size.width, size.height);
		}
	}

	function toggleImmersive() {
		setImmersive(!immersive);
	}

	return {
		get queue() {
			return queue;
		},
		get index() {
			return index;
		},
		get current() {
			return current;
		},
		get status() {
			return status;
		},
		get position() {
			return position;
		},
		get duration() {
			return duration;
		},
		get progress() {
			return progress;
		},
		get volume() {
			return volume;
		},
		get muted() {
			return muted;
		},
		get shuffle() {
			return shuffle;
		},
		get repeat() {
			return repeat;
		},
		get radio() {
			return radio;
		},
		get refilling() {
			return refilling;
		},
		get immersive() {
			return immersive;
		},
		get apiReady() {
			return apiReady;
		},
		get mountError() {
			return mountError;
		},
		get isPlaying() {
			return isPlaying;
		},
		mount,
		playNow,
		playAt,
		addToQueue,
		addNext,
		removeAt,
		move,
		moveToNext,
		moveToTop,
		clearQueue,
		refillQueue,
		togglePlay,
		resume,
		pause: pauseAction,
		next,
		prev,
		seek,
		setVolume,
		toggleMute,
		toggleShuffle,
		cycleRepeat,
		toggleRadio,
		setImmersive,
		toggleImmersive
	};
}

export const player = createPlayer();
