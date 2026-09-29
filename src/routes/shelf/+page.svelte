<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import MixTile from '$lib/components/MixTile.svelte';
	import Tile from '$lib/components/Tile.svelte';
	import TrackMenu from '$lib/components/TrackMenu.svelte';
	import { formatDuration, formatRuntime } from '$lib/format';
	import { likes } from '$lib/likes.svelte';
	import { mixes } from '$lib/mixes.svelte';
	import { player } from '$lib/player.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import type { LikedCollection, LikedTrack } from '$lib/types';

	type Filter = 'all' | 'tracks' | 'albums' | 'playlists' | 'mixes';

	const FILTERS: Array<{ id: Filter; label: string }> = [
		{ id: 'all', label: 'all' },
		{ id: 'tracks', label: 'tracks' },
		{ id: 'albums', label: 'albums' },
		{ id: 'playlists', label: 'playlists' },
		{ id: 'mixes', label: 'mixes' }
	];

	const HINTS: Record<Exclude<Filter, 'all'>, string> = {
		tracks: 'heart a track from the deck, or from the + menu on any row.',
		albums: 'like an album from its page — or from the albums shelf in search.',
		playlists: 'like a playlist from its page — or from the playlists shelf in search.',
		mixes: 'a mix is a snapshot of tracks you keep — build one by hand, or save any album.'
	};
	let filter = $state<Filter>('all');
	let creating = $state(false);
	let name = $state('');

	// home can deep-link a tab: /library?filter=mixes
	$effect(() => {
		const wanted = page.url.searchParams.get('filter');
		if (wanted && FILTERS.some((f) => f.id === wanted)) filter = wanted as Filter;
	});

	const likedTracks = $derived(
		likes.items.filter((item): item is LikedTrack => item.type === 'track').map((item) => item.track)
	);
	const likedAlbums = $derived(
		likes.items.filter((item): item is LikedCollection => item.type === 'album')
	);
	const likedPlaylists = $derived(
		likes.items.filter((item): item is LikedCollection => item.type === 'playlist')
	);
	const runtime = $derived(likedTracks.reduce((sum, track) => sum + (track.duration || 0), 0));

	const counts = $derived<Record<Filter, number>>({
		all: likes.items.length + mixes.items.length,
		tracks: likedTracks.length,
		albums: likedAlbums.length,
		playlists: likedPlaylists.length,
		mixes: mixes.items.length
	});

	const show = (id: Filter) => filter === 'all' || filter === id;

	function createMix(event: SubmitEvent) {
		event.preventDefault();
		const mix = mixes.create(name);
		creating = false;
		name = '';
		void goto(`/mixes/${mix.id}`);
	}

	function playAll() {
		if (likedTracks.length) player.playNow(likedTracks[0], likedTracks);
	}

	function shuffleLiked() {
		if (!likedTracks.length) return;
		const list = [...likedTracks];
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
		player.playNow(list[0], list);
	}

	function unlikeCollection(item: LikedCollection) {
		likes.toggleCollection({
			kind: item.type,
			id: item.id,
			title: item.title,
			subtitle: item.subtitle,
			art: item.art
		});
		toasts.push(`took “${item.title}” out of likes`, 'info');
	}
</script>

<svelte:head>
	<title>shelf — FLAVOURS</title>
</svelte:head>

<div class="shelf-page">
	<header class="page-head">
		<h1 class="display">shelf</h1>
		<span class="grow"></span>
		{#if !creating}
			<button class="btn btn--accent" onclick={() => (creating = true)}>
				<Icon name="plus" size={15} /> new mix
			</button>
		{/if}
	</header>

	<nav class="filters" aria-label="Shelf filters">
		{#each FILTERS as item (item.id)}
			<button class="filter" class:on={filter === item.id} onclick={() => (filter = item.id)}>
				{item.label}
				<span class="count mono">{counts[item.id]}</span>
			</button>
		{/each}
	</nav>

	{#if creating}
		<form class="card new-form" onsubmit={createMix}>
			<input
				class="input"
				placeholder="name your mix"
				bind:value={name}
				aria-label="Mix name"
				autocomplete="off"
			/>
			<button class="btn btn--accent" type="submit">create</button>
			<button class="btn btn--ghost" type="button" onclick={() => (creating = false)}>cancel</button>
		</form>
	{/if}

	{#if counts.all === 0 && !creating}
		<section class="card empty">
			<div class="empty-art squircle"><Icon name="disc" size={26} stroke={1.8} /></div>
			<h2 class="display">the shelf is empty</h2>
			<p class="muted">
				like tracks and albums as you listen, and keep the ones you love in mixes — it all lands
				here, no account needed.
			</p>
			<div class="empty-row">
				<button class="btn btn--accent" onclick={() => (creating = true)}>
					<Icon name="plus" size={15} /> new mix
				</button>
				<button class="btn" onclick={() => goto('/search')}>
					<Icon name="search" size={15} /> find tracks
				</button>
			</div>
		</section>
	{:else}
		{#if show('tracks') && likedTracks.length}
			<section class="shelf" aria-label="Liked tracks">
				<header class="shelf-head">
					<span class="label mono">
						liked tracks · {likedTracks.length}{runtime ? ` · ${formatRuntime(runtime)}` : ''}
					</span>
					<span class="grow"></span>
					<button class="mini-btn" onclick={playAll} title="Play all liked tracks">
						<Icon name="play" size={12} /> play all
					</button>
					<button class="mini-btn" onclick={shuffleLiked} title="Shuffle liked tracks">
						<Icon name="shuffle" size={12} /> shuffle
					</button>
				</header>
				<ul class="card rows">
					{#each likedTracks as track, i (track.id)}
						{@const active = player.current?.id === track.id}
						<li class="row" class:active>
							<button
								class="hit"
								onclick={() => player.playNow(track, likedTracks)}
								title="Play “{track.title}”"
							>
								<span class="idx">
									{#if active}
										<span class="eq" class:paused={!player.isPlaying}><i></i><i></i><i></i><i></i></span
										>
									{:else}
										{i + 1}
									{/if}
								</span>
								{#if track.art}
									<img class="thumb squircle" src={track.art} alt="" loading="lazy" referrerpolicy="no-referrer" />
								{:else}
									<span class="thumb squircle fallback"><Icon name="music" size={15} /></span>
								{/if}
								<span class="meta">
									<strong class="truncate">{track.title}</strong>
									<em class="truncate">{track.artist}</em>
								</span>
								<span class="dur mono">{formatDuration(track.duration)}</span>
							</button>
							<TrackMenu {track} />
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if show('albums') && likedAlbums.length}
			<section class="shelf" aria-label="Liked albums">
				<header class="shelf-head">
					<span class="label mono">liked albums</span>
					<span class="grow"></span>
				</header>
				<ul class="tiles">
					{#each likedAlbums as item (item.id)}
						<li class="coll">
							<Tile
								art={item.art}
								title={item.title}
								subtitle={item.subtitle}
								kind="album"
								action="open"
								label="Open “{item.title}”"
								onclick={() => goto(`/collection/album/${item.id}`)}
							/>
							<button
								class="undo"
								title="Remove “{item.title}” from likes"
								aria-label="Remove “{item.title}” from likes"
								onclick={() => unlikeCollection(item)}
							>
								<Icon name="heart-filled" size={13} />
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if show('playlists') && likedPlaylists.length}
			<section class="shelf" aria-label="Liked playlists">
				<header class="shelf-head">
					<span class="label mono">liked playlists</span>
					<span class="grow"></span>
				</header>
				<ul class="tiles">
					{#each likedPlaylists as item (item.id)}
						<li class="coll">
							<Tile
								art={item.art}
								title={item.title}
								subtitle={item.subtitle}
								kind="playlist"
								action="open"
								label="Open “{item.title}”"
								onclick={() => goto(`/collection/playlist/${item.id}`)}
							/>
							<button
								class="undo"
								title="Remove “{item.title}” from likes"
								aria-label="Remove “{item.title}” from likes"
								onclick={() => unlikeCollection(item)}
							>
								<Icon name="heart-filled" size={13} />
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if show('mixes') && mixes.items.length}
			<section class="shelf" aria-label="Mixes">
				<header class="shelf-head">
					<span class="label mono">mixes</span>
					<span class="grow"></span>
					<span class="label mono">{mixes.items.length}</span>
				</header>
				<ul class="tiles">
					{#each mixes.items as mix (mix.id)}
						<li><MixTile {mix} onclick={() => goto(`/mixes/${mix.id}`)} /></li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if filter !== 'all' && counts[filter] === 0 && !creating}
			<section class="card empty">
				<div class="empty-art squircle"><Icon name="disc" size={24} stroke={1.8} /></div>
				<h2 class="display">no {filter} on the shelf</h2>
				<p class="muted">{HINTS[filter]}</p>
				<div class="empty-row">
					<button class="btn" onclick={() => goto('/search')}>
						<Icon name="search" size={15} /> find music
					</button>
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	.shelf-page {
		display: grid;
		gap: clamp(14px, 1.8vw, 20px);
		min-width: 0;
	}
	.page-head {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 2px 2px 0;
	}
	.page-head .display {
		font-size: clamp(1.7rem, 3.4vw, 2.4rem);
	}

	/* ---------- filters ---------- */
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 0 2px;
	}
	.filter {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 6px 13px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface);
		box-shadow: 2px 2px 0 var(--ink);
		font-weight: 700;
		font-size: 0.82rem;
		cursor: pointer;
		transition:
			transform var(--t),
			background-color 0.15s ease,
			color 0.15s ease;
	}
	.filter:hover {
		transform: translate(-1px, -1px);
	}
	.filter.on {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.count {
		font-size: 0.66rem;
		font-weight: 700;
		padding: 1px 7px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface-2);
		color: var(--ink);
	}
	.filter.on .count {
		background: var(--surface);
	}

	.new-form {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px;
	}
	.new-form .input {
		flex: 1;
		min-width: 0;
	}

	/* ---------- shelves ---------- */
	.shelf {
		display: grid;
		gap: 8px;
		min-width: 0;
	}
	.shelf-head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
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
	.mini-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 10px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface);
		box-shadow: 2px 2px 0 var(--ink);
		font-size: 0.72rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			transform var(--t),
			color 0.15s ease;
	}
	.mini-btn:hover {
		transform: translate(-1px, -1px);
	}

	/* liked tracks: a proper list */
	.rows {
		list-style: none;
		margin: 0;
		padding: 4px 10px 8px;
		display: grid;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 3px;
		border-bottom: 2px dashed var(--faint);
		padding: 2px 0;
	}
	.row:last-child {
		border-bottom: 0;
	}
	.row.active {
		background: var(--accent-soft);
		border-radius: 12px;
	}
	.hit {
		display: grid;
		grid-template-columns: 26px 42px minmax(0, 1fr) auto;
		align-items: center;
		gap: 9px;
		padding: 6px 6px;
		border-radius: 13px;
		text-align: left;
		cursor: pointer;
		min-width: 0;
		transition: transform 0.14s var(--ease-pop);
	}
	.hit:hover {
		transform: translateX(3px);
	}
	.idx {
		display: grid;
		place-items: center;
		font-weight: 700;
		font-size: 0.78rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.row.active .idx {
		color: var(--accent);
	}
	.thumb {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		object-fit: cover;
		border: 2px solid var(--ink);
		border-radius: 11px;
		background: var(--surface-2);
		color: var(--muted);
	}
	.meta {
		display: grid;
		min-width: 0;
		line-height: 1.18;
	}
	.meta strong {
		font-size: 0.88rem;
	}
	.meta em {
		font-style: normal;
		font-size: 0.74rem;
		color: var(--muted);
	}
	.dur {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--muted);
	}

	/* liked albums/playlists + mixes: tiles */
	.tiles {
		list-style: none;
		margin: 0;
		padding: 4px 4px 10px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: clamp(14px, 1.6vw, 20px);
	}
	.coll {
		position: relative;
		min-width: 0;
	}
	.undo {
		position: absolute;
		top: 7px;
		right: 7px;
		z-index: 2;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border: 2px solid var(--ink);
		border-radius: 11px;
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow: 2px 2px 0 var(--ink);
		opacity: 0;
		cursor: pointer;
		transition:
			opacity 0.15s ease,
			transform var(--t);
	}
	.coll:hover .undo,
	.undo:focus-visible {
		opacity: 1;
	}
	.undo:hover {
		transform: translate(-1px, -1px);
	}
	@media (hover: none) {
		.undo {
			opacity: 1;
		}
	}

	/* ---------- empty ---------- */
	.empty {
		display: grid;
		justify-items: center;
		gap: 9px;
		padding: clamp(30px, 5vw, 52px) 20px;
		text-align: center;
	}
	.empty-art {
		display: grid;
		place-items: center;
		width: 62px;
		height: 62px;
		border: var(--bw) solid var(--ink);
		border-radius: 22px;
		background: var(--surface-2);
		color: var(--muted);
		box-shadow: var(--shadow-sm);
	}
	.empty h2 {
		font-size: 1.35rem;
	}
	.empty p {
		max-width: 42ch;
	}
	.empty-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 6px;
	}

	@media (max-width: 640px) {
		.hit {
			grid-template-columns: 22px 40px minmax(0, 1fr);
		}
		.dur {
			display: none;
		}
		.filters {
			overflow-x: auto;
			flex-wrap: nowrap;
			padding-bottom: 4px;
		}
		.filter {
			flex: none;
		}
	}
</style>
