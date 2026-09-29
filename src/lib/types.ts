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

/** An album or playlist card in the browse shelves */
export interface Collection {
	id: string;
	kind: 'album' | 'playlist';
	title: string;
	/** artist / author / year line */
	subtitle: string;
	art: string;
}

/** A track, or a whole album/playlist, in the recently-played shelf. */
export interface HistoryTrack {
	type: 'track';
	track: Track;
}
export interface HistoryCollection {
	type: 'album' | 'playlist';
	id: string;
	title: string;
	subtitle: string;
	art: string;
}
export type HistoryItem = HistoryTrack | HistoryCollection;

/** A liked track or collection — same shape as history, different shelf. */
export type LikedTrack = HistoryTrack;
export type LikedCollection = HistoryCollection;
export type LikedItem = LikedTrack | LikedCollection;
