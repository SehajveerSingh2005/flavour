import { browser } from '$app/environment';

/**
 * Backup: every `flavour:` key in localStorage as one JSON file, and back.
 * Local-first means the browser is the only home for this data — a file is
 * the cheapest insurance (and how you move a library between machines).
 */

const PREFIX = 'flavour:';

export function exportData() {
	if (!browser) return;
	const data: Record<string, string> = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(PREFIX)) data[key] = localStorage.getItem(key) ?? '';
	}
	const payload = {
		app: 'flavours',
		version: 1,
		exportedAt: new Date().toISOString(),
		data
	};
	const blob = new Blob([JSON.stringify(payload, null, '\t')], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `flavours-${new Date().toISOString().slice(0, 10)}.json`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	// give the download a moment before the blob goes away
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Writes a backup file into localStorage and reports how many keys landed. */
export async function importData(file: File): Promise<number> {
	const parsed: unknown = JSON.parse(await file.text());
	const data = (parsed as { data?: unknown })?.data as Record<string, unknown> | undefined;
	if (!data || typeof data !== 'object') throw new Error('not a flavour backup');

	let count = 0;
	for (const [key, value] of Object.entries(data)) {
		if (!key.startsWith(PREFIX) || typeof value !== 'string') continue;
		localStorage.setItem(key, value);
		count++;
	}
	if (!count) throw new Error('nothing to import');
	return count;
}
