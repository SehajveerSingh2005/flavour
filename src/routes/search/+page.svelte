<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import ResultsList from '$lib/components/ResultsList.svelte';
	import Tile from '$lib/components/Tile.svelte';
	import { mixes } from '$lib/mixes.svelte';
	import { likes } from '$lib/likes.svelte';
	import { search } from '$lib/search.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import type { Collection, Track } from '$lib/types';

	let opening = $state<string | null>(null);
	let lastRun = $state('');

	const q = $derived((page.url.searchParams.get('q') ?? '').trim());
	const ready = $derived(search.lastQuery === q);

	$effect(() => {
		const query = q;
		if (query.length < 2 || query === lastRun) return;
		lastRun = query;
		if (search.lastQuery !== query) void search.run(query);
	});

	async function fetchCollection(item: Collection): Promise<Track[]> {
		const res = await fetch(`/api/collection?type=${item.kind}&id=${encodeURIComponent(item.id)}`);
		if (!res.ok) throw new Error('failed');
		const data = (await res.json()) as { tracks?: Track[] };
		const tracks = data.tracks ?? [];
		if (!tracks.length) throw new Error('empty');
		return tracks;
	}

	function openCollection(item: Collection) {
		void goto(`/collection/${item.kind}/${item.id}`);
	}

	async function saveMix(item: Collection) {
		if (opening) return;
		opening = item.id;
		try {
			const tracks = await fetchCollection(item);
			const mix = mixes.create(item.title, tracks);
			toasts.push(`saved as “${mix.name}” · ${tracks.length} tracks`, 'accent');
		} catch {
			toasts.push(`Could not save that ${item.kind}`, 'error');
		} finally {
			opening = null;
		}
	}

	function toggleLike(item: Collection) {
		const liked = likes.toggleCollection({
			kind: item.kind,
			id: item.id,
			title: item.title,
			subtitle: item.subtitle,
			art: item.art
		});
		toasts.push(
			liked ? `liked “${item.title}”` : `took “${item.title}” out of likes`,
			liked ? 'accent' : 'info'
		);
	}

</script>

<svelte:head>
	<title>{q ? `${q} — FLAVOURS` : 'search — FLAVOURS'}</title>
</svelte:head>

{#snippet collectionShelf(items: Collection[], kind: 'album' | 'playlist')}
	{#if items.length}
		<section class="card side-card">
			<h3 class="side-head">
				<Icon name={kind === 'album' ? 'disc' : 'list'} size={15} />
				{kind}s
				<span class="count mono">{items.length}</span>
			</h3>
			<div class="mini-grid">
				{#each items as item (item.id)}
					<div class="coll">
						<Tile
							art={item.art}
							title={item.title}
							subtitle={item.subtitle}
							{kind}
							action="open"
							label="Open “{item.title}”"
							onclick={() => openCollection(item)}
						/>
						<button
							class="like"
							class:on={likes.hasCollection(item.kind, item.id)}
							title={likes.hasCollection(item.kind, item.id) ? 'Unlike' : 'Like'}
							aria-label={likes.hasCollection(item.kind, item.id) ? `Unlike “${item.title}”` : `Like “${item.title}”`}
							aria-pressed={likes.hasCollection(item.kind, item.id)}
							onclick={() => toggleLike(item)}
						>
							<Icon name={likes.hasCollection(item.kind, item.id) ? 'heart-filled' : 'heart'} size={13} />
						</button>
						<button class="save" title="Save as a mix" onclick={() => saveMix(item)}>
							<Icon name="plus" size={13} />
						</button>
					</div>
				{/each}
			</div>
		</section>
	{/if}
{/snippet}

{#if q.length < 2}
	<section class="card empty">
		<Icon name="search" size={26} />
		<h1 class="display">search something</h1>
		<p class="muted">type in the field up top, or paste a YouTube link.</p>
	</section>
{:else}
	<div class="search-page">
		<header class="results-head">
			<h1 class="display truncate">{q}</h1>
			<p class="meta-line mono">
				{#if !ready}
					<span class="spinner"></span> searching…
				{:else}
					{search.results.length} tracks · {search.albums.length} albums · {search.playlists.length}
					playlists
				{/if}
			</p>
		</header>

		<div class="results-cols">
			<section class="card tray" aria-label="Tracks">
				<ResultsList />
			</section>

			<div class="side-stack">
				{@render collectionShelf(search.albums, 'album')}
				{@render collectionShelf(search.playlists, 'playlist')}

				{#if ready && search.albums.length}
					<p class="save-hint muted">
						<Icon name="plus" size={12} /> on a cover saves the whole thing as a mix
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.search-page {
		display: grid;
		gap: clamp(14px, 1.8vw, 20px);
		min-width: 0;
	}
	.results-head {
		display: grid;
		gap: 4px;
		padding: 2px 2px 0;
		min-width: 0;
	}
	.results-head .display {
		font-size: clamp(1.7rem, 3.4vw, 2.4rem);
	}
	.meta-line {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.76rem;
		color: var(--muted);
	}
	.results-cols {
		display: grid;
		grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
		gap: clamp(14px, 1.8vw, 20px);
		align-items: start;
	}
	.card.tray {
		min-width: 0;
		padding: 6px 12px 10px;
	}
	.side-stack {
		display: grid;
		gap: clamp(14px, 1.8vw, 20px);
		min-width: 0;
	}
	.side-card {
		padding: 13px 14px 16px;
	}
	.side-head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 0 12px;
		font-size: 0.95rem;
	}
	.count {
		font-size: 0.68rem;
		font-weight: 700;
		padding: 1px 7px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--accent);
		color: var(--accent-ink);
	}
	.mini-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}
	.coll {
		position: relative;
		min-width: 0;
	}
	.save,
	.like {
		position: absolute;
		top: 7px;
		z-index: 2;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border: 2px solid var(--ink);
		border-radius: 11px;
		background: var(--surface);
		box-shadow: 2px 2px 0 var(--ink);
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 0.15s ease,
			transform var(--t);
	}
	.save {
		right: 7px;
	}
	.like {
		left: 7px;
	}
	.like.on {
		opacity: 1;
		background: var(--accent);
		color: var(--accent-ink);
	}
	.coll:hover .save,
	.coll:hover .like,
	.save:focus-visible,
	.like:focus-visible {
		opacity: 1;
	}
	.save:hover,
	.like:hover {
		transform: translate(-1px, -1px);
	}
	@media (hover: none) {
		.save,
		.like {
			opacity: 1;
		}
	}
	.save-hint {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 0 2px;
		font-size: 0.72rem;
	}
	.empty {
		display: grid;
		justify-items: center;
		gap: 9px;
		padding: clamp(30px, 6vw, 60px) 20px;
		text-align: center;
		color: var(--muted);
	}
	.empty h1 {
		font-size: 1.5rem;
	}
	@media (max-width: 1080px) {
		.results-cols {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
