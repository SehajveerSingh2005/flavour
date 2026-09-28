<script lang="ts">
	import { history } from '$lib/history.svelte';
	import { player } from '$lib/player.svelte';
	import { QUICK } from '$lib/quick';
	import { toasts } from '$lib/toasts.svelte';
	import type { Collection, Track } from '$lib/types';
	import Tile from './Tile.svelte';

	/** one shelf per seed per session — no refetching when hopping around the app */
	const cache = new Map<string, Collection[]>();

	let items = $state<Collection[]>([]);
	let ready = $state(false);
	let opening = $state<string | null>(null);
	let tried = '';

	$effect(() => {
		if (!history.hydrated) return;
		const seed = history.items[0]?.artist ?? '';
		if (seed === tried) return;
		tried = seed;
		const hit = cache.get(seed);
		if (hit) {
			items = hit;
			ready = true;
			return;
		}
		ready = false;
		void load(seed);
	});

	async function load(seed: string) {
		const queries = [seed, ...QUICK]
			.filter((q, i, all) => q.length > 1 && all.findIndex((x) => x.toLowerCase() === q.toLowerCase()) === i)
			.slice(0, 3);
		try {
			const batches = await Promise.all(
				queries.map(async (q) => {
					const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
					if (!res.ok) return [] as Collection[];
					const data = (await res.json()) as { albums?: Collection[]; playlists?: Collection[] };
					return [...(data.albums ?? []), ...(data.playlists ?? [])].slice(0, 3);
				})
			);
			const merged: Collection[] = [];
			const seen = new Set<string>();
			// round-robin so every seed gets its covers on the first row
			for (let round = 0; round < 3; round++) {
				for (const batch of batches) {
					const item = batch[round];
					if (!item || seen.has(item.id) || merged.length >= 8) continue;
					seen.add(item.id);
					merged.push(item);
				}
			}
			cache.set(seed, merged);
			if (tried !== seed) return;
			items = merged;
		} catch {
			/* the shelf just stays hidden */
		} finally {
			if (tried === seed) ready = true;
		}
	}

	async function open(item: Collection) {
		if (opening) return;
		opening = item.id;
		try {
			const res = await fetch(`/api/collection?type=${item.kind}&id=${encodeURIComponent(item.id)}`);
			if (!res.ok) throw new Error('failed');
			const data = (await res.json()) as { tracks?: Track[] };
			const tracks = data.tracks ?? [];
			if (!tracks.length) throw new Error('empty');
			player.playNow(tracks[0], tracks);
			toasts.push(
				`${item.kind === 'album' ? 'Album' : 'Playlist'} · ${tracks.length} tracks queued`,
				'accent'
			);
		} catch {
			toasts.push(`Could not load that ${item.kind}`, 'error');
		} finally {
			opening = null;
		}
	}
</script>

{#if items.length || !ready}
	<section class="shelf" aria-label="Recommended">
		<header class="shelf-head">
			<span class="label mono">recommended</span>
			<span class="grow"></span>
			{#if !ready}<span class="spinner"></span>{/if}
		</header>
		<ul class="covers">
			{#each items as item (item.id)}
				<li>
					<Tile
						art={item.art}
						title={item.title}
						subtitle={item.subtitle}
						kind={item.kind}
						loading={opening === item.id}
						disabled={opening !== null}
						onclick={() => open(item)}
					/>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.shelf {
		display: grid;
		gap: 8px;
		min-width: 0;
	}
	.shelf-head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 2px;
	}
	.label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--muted);
	}
	.covers {
		list-style: none;
		margin: 0;
		padding: 4px 4px 12px;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: clamp(132px, 15vw, 170px);
		gap: clamp(12px, 1.4vw, 18px);
		overflow-x: auto;
		scrollbar-width: thin;
	}
</style>
