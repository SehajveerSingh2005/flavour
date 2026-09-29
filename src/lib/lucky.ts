import { history } from './history.svelte';
import { search } from './search.svelte';

/**
 * What the "lucky" button searches when the field is empty.
 *
 * No hardcoded suggestions — lucky only ever leans on what the listener has
 * already shown they like: the artist they played last, or their last search.
 * Returns null when there is genuinely nothing to go on.
 */
export function luckyQuery(): string | null {
	const typed = search.query.trim();
	if (typed.length > 1) return typed;
	const last = history.items[0];
	if (last?.artist) return last.artist;
	return search.recents[0] ?? null;
}
