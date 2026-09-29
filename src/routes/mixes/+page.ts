import { redirect } from '@sveltejs/kit';

/** The mixes list now lives on the shelf. */
export function load() {
	redirect(308, '/shelf?filter=mixes');
}
