export interface Track {
	/** YouTube video id used for playback */
	id: string;
	title: string;
	artist: string;
	/** seconds; 0 when unknown */
	duration: number;
	/** album / thumbnail image url */
	art: string;
	/** where the result came from */
	source: 'music' | 'video';
}

/** A track inside the queue — `uid` keeps list animation stable across reorders. */
export interface QueueItem extends Track {
	uid: string;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering';
