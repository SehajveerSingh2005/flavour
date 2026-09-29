/**
 * Tiny in-process memo for warm function instances.
 *
 * The edge cache covers identical requests across the CDN; this sits in
 * front of YouTube for the requests it can't: a burst of parallel queries
 * (typing, aborted requests, two tabs) and repeats on a warm instance.
 * Errors are never cached so a flaky upstream call can be retried.
 */

const TTL = 5 * 60_000;
const MAX = 200;

interface Entry {
	at: number;
	value: unknown;
}

const values = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export function memo<T>(key: string, load: () => Promise<T>, ttl = TTL): Promise<T> {
	const hit = values.get(key);
	if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value as T);
	if (hit) values.delete(key);

	const pending = inflight.get(key);
	if (pending) return pending as Promise<T>;

	const promise = load().then(
		(value) => {
			// re-insert so fresher entries sit at the end of the map
			values.delete(key);
			values.set(key, { at: Date.now(), value });
			if (values.size > MAX) {
				const oldest = values.keys().next().value;
				if (oldest !== undefined) values.delete(oldest);
			}
			inflight.delete(key);
			return value;
		},
		(error) => {
			inflight.delete(key);
			throw error;
		}
	);

	inflight.set(key, promise);
	return promise;
}
