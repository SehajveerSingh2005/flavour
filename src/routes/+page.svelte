<script lang="ts">
	import { goto } from '$app/navigation';
	import { exportData, importData } from '$lib/backup';
	import Icon from '$lib/components/Icon.svelte';
	import MixTile from '$lib/components/MixTile.svelte';
	import Recommended from '$lib/components/Recommended.svelte';
	import Tile from '$lib/components/Tile.svelte';
	import { history } from '$lib/history.svelte';
	import { likes } from '$lib/likes.svelte';
	import { luckyQuery } from '$lib/lucky';
	import { mixes } from '$lib/mixes.svelte';
	import { player } from '$lib/player.svelte';
	import { search } from '$lib/search.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import type { HistoryTrack } from '$lib/types';

	let creating = $state(false);
	let name = $state('');

	/** the queue a past track plays in: the tracks you played, in order */
	const playedTracks = $derived(
		history.items.filter((item): item is HistoryTrack => item.type === 'track').map((item) => item.track)
	);

	/** lucky: the typed query's top hit, or a gamble on your own listening */
	async function lucky() {
		const q = luckyQuery();
		if (!q) {
			toasts.push('Nothing to gamble on yet — search something first', 'error');
			return;
		}
		search.setQuery(q);
		const tracks = await search.run(q);
		if (!tracks.length && !search.error) {
			toasts.push('Nothing found — try different words', 'error');
			return;
		}
		if (tracks[0]) player.playNow(tracks[0], tracks);
	}

	function createMix(event: SubmitEvent) {
		event.preventDefault();
		const mix = mixes.create(name);
		creating = false;
		name = '';
		void goto(`/mixes/${mix.id}`);
	}

	async function onImport(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			const count = await importData(file);
			toasts.push(`imported ${count} saved things — reloading`, 'accent');
			setTimeout(() => location.reload(), 700);
		} catch {
			toasts.push('That does not look like a flavours backup', 'error');
		} finally {
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>FLAVOURS — music, freshly squeezed</title>
</svelte:head>

<div class="home">
	{#if !history.items.length && !mixes.items.length && !likes.items.length}
		<section class="card welcome">
			<div class="welcome-art" aria-hidden="true">
				<span class="disc"></span>
				<span class="cover squircle"><Icon name="disc" size={26} stroke={1.8} /></span>
			</div>
			<span class="badge">nothing on the menu</span>
			<h1 class="display">press play on something delicious</h1>
			<p class="muted">Search up top, paste a YouTube link, or let lucky surprise you.</p>
			<button class="btn btn--accent" onclick={lucky}>
				<Icon name="sparkles" size={15} /> lucky
			</button>
		</section>
	{/if}

	{#if history.items.length}
		<section class="shelf" aria-label="Recently played">
			<header class="shelf-head">
				<span class="label mono">jump back in</span>
				<span class="grow"></span>
				<button class="mini-btn" onclick={() => history.clear()} title="Clear history">
					<Icon name="x" size={12} /> clear
				</button>
			</header>
			<ul class="covers">
				{#each history.items as item, i (item.type === 'track' ? `t${i}:${item.track.id}` : `c${i}:${item.id}`)}
					<li>
						{#if item.type === 'track'}
							<Tile
								art={item.track.art}
								title={item.track.title}
								subtitle={item.track.artist}
								onclick={() => player.playNow(item.track, playedTracks)}
							/>
						{:else}
							<Tile
								art={item.art}
								title={item.title}
								subtitle={item.subtitle}
								kind={item.type}
								action="open"
								label="Open “{item.title}”"
								onclick={() => goto(`/collection/${item.type}/${item.id}`)}
							/>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if likes.items.length}
		<section class="shelf" aria-label="Liked">
			<header class="shelf-head">
				<span class="label mono">liked</span>
				<span class="grow"></span>
				<span class="label mono">{likes.items.length}</span>
			</header>
			<ul class="covers">
				{#each likes.items as track (track.id)}
					<li>
						<Tile
							art={track.art}
							title={track.title}
							subtitle={track.artist}
							onclick={() => player.playNow(track, likes.items)}
						/>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<Recommended />

	<section class="shelf" aria-label="Your mixes">
		<header class="shelf-head">
			<span class="label mono">your mixes</span>
			<span class="grow"></span>
			{#if mixes.items.length}
				<span class="label mono">{mixes.items.length}</span>
			{/if}
		</header>
		<ul class="tiles">
			{#each mixes.items as mix (mix.id)}
				<li><MixTile {mix} onclick={() => goto(`/mixes/${mix.id}`)} /></li>
			{/each}
			<li>
				{#if creating}
					<form class="new-mix" onsubmit={createMix}>
						<input
							class="input"
							placeholder="name your mix"
							bind:value={name}
							aria-label="Mix name"
							autocomplete="off"
						/>
						<div class="new-mix-row">
							<button class="btn btn--accent" type="submit">create</button>
							<button class="btn btn--ghost" type="button" onclick={() => (creating = false)}>
								cancel
							</button>
						</div>
					</form>
				{:else}
					<button class="new-tile" onclick={() => (creating = true)}>
						<Icon name="plus" size={24} />
						<span>new mix</span>
					</button>
				{/if}
			</li>
		</ul>
	</section>

	<section class="shelf" aria-label="Backup">
		<header class="shelf-head">
			<span class="label mono">backup</span>
			<span class="grow"></span>
		</header>
		<div class="backup-row">
			<button class="mini-btn" onclick={exportData} title="Download mixes, likes, queue and history">
				<Icon name="download" size={12} /> export
			</button>
			<label class="mini-btn" title="Restore a flavours backup file">
				<Icon name="upload" size={12} /> import
				<input class="file-input" type="file" accept=".json,application/json" onchange={onImport} />
			</label>
			<span class="backup-hint muted">
				local-first — mixes, likes, queue and history live in this browser
			</span>
		</div>
	</section>
</div>

<style>
	.home {
		display: grid;
		gap: clamp(18px, 2.2vw, 26px);
		min-width: 0;
	}

	/* ---------- first run ---------- */
	.welcome {
		display: grid;
		justify-items: center;
		gap: 9px;
		padding: clamp(20px, 3vw, 32px) 20px;
		text-align: center;
		/* both stops come from the flavour's primary colour, so the empty card
		   reads as the same flavour as the player deck — not the secondary tone */
		background: linear-gradient(
			118deg,
			color-mix(in srgb, var(--accent) 13%, var(--surface)),
			color-mix(in srgb, var(--accent) 30%, var(--surface))
		);
	}
	.welcome .badge {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.welcome-art {
		position: relative;
		width: 88px;
		aspect-ratio: 1;
		margin: 4px 16px 10px 0;
	}
	.welcome-art .disc {
		position: absolute;
		right: -22%;
		bottom: 2%;
		width: 84%;
		aspect-ratio: 1;
		border: 3px solid var(--ink);
		border-radius: 50%;
		background:
			conic-gradient(
				from 210deg at 50% 50%,
				rgb(255 255 255 / 0.16),
				transparent 22%,
				transparent 58%,
				rgb(255 255 255 / 0.09) 78%,
				transparent 92%
			),
			repeating-radial-gradient(
				circle at 50% 50%,
				rgb(255 255 255 / 0.075) 0 1px,
				transparent 1px 4px
			),
			radial-gradient(circle at 50% 50%, #4d4d5c 0 16%, #1c1c26 17% 97%, #31313f 98%);
		animation: spin-slow 16s linear infinite;
	}
	.welcome-art .cover {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border: var(--bw) solid var(--ink);
		border-radius: 24px;
		background: var(--surface);
		color: var(--accent);
		box-shadow: var(--shadow-sm);
		transform: rotate(-1.5deg);
	}
	.welcome h1 {
		font-size: clamp(1.4rem, 3vw, 1.9rem);
		max-width: 22ch;
	}
	.welcome p {
		font-size: 0.92rem;
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
		gap: 4px;
		padding: 2px 8px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface);
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--muted);
		cursor: pointer;
		transition:
			transform var(--t),
			color 0.15s ease;
	}
	.mini-btn:hover {
		transform: translate(-1px, -1px);
		color: var(--ink);
	}

	/* jump back in — proper covers, scrolled sideways */
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

	/* mixes */
	.tiles {
		list-style: none;
		margin: 0;
		padding: 4px 4px 12px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: clamp(14px, 1.6vw, 20px);
	}
	.new-tile {
		display: grid;
		place-items: center;
		align-content: center;
		gap: 9px;
		width: 100%;
		aspect-ratio: 1;
		border: var(--bw) dashed var(--ink);
		border-radius: 20px;
		background: color-mix(in srgb, var(--surface) 55%, transparent);
		color: var(--muted);
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
		transition:
			transform var(--t),
			color 0.15s ease,
			border-color 0.15s ease;
	}
	.new-tile:hover {
		transform: translate(-2px, -2px);
		color: var(--ink);
	}
	.new-mix {
		display: grid;
		gap: 9px;
		width: 100%;
		height: 100%;
		min-height: 150px;
		align-content: center;
		padding: 12px;
		border: var(--bw) dashed var(--ink);
		border-radius: 20px;
		background: color-mix(in srgb, var(--surface) 70%, transparent);
	}
	.new-mix .input {
		/* inputs have a big intrinsic minimum — let the field shrink into the tile */
		min-width: 0;
		padding: 0.6rem 0.85rem;
		font-size: 0.9rem;
	}
	.new-mix-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.new-mix-row .btn {
		flex: 1 1 auto;
		min-width: 0;
		padding: 0.5rem 0.6rem;
		font-size: 0.8rem;
	}
	.new-mix-row .btn--ghost {
		flex: 0 1 auto;
	}

	/* ---------- backup ---------- */
	.backup-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 0 2px;
	}
	.backup-row .mini-btn {
		gap: 5px;
	}
	.file-input {
		display: none;
	}
	.backup-hint {
		font-size: 0.76rem;
	}
</style>
