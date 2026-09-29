<script lang="ts">
	import { flip } from 'svelte/animate';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { formatDuration, formatRuntime } from '$lib/format';
	import { mixes } from '$lib/mixes.svelte';
	import { player } from '$lib/player.svelte';

	const mix = $derived(mixes.byId(page.params.id ?? ''));

	let renaming = $state(false);
	let name = $state('');
	let renameInput = $state<HTMLInputElement | null>(null);
	let confirmDelete = $state(false);
	let dragFrom = $state<number | null>(null);
	let dragOver = $state<number | null>(null);

	const arts = $derived((mix?.tracks ?? []).map((track) => track.art).filter(Boolean).slice(0, 4));
	const runtime = $derived((mix?.tracks ?? []).reduce((sum, track) => sum + (track.duration || 0), 0));

	$effect(() => {
		name = mix?.name ?? '';
	});

	$effect(() => {
		if (renaming) renameInput?.focus();
	});

	function play() {
		if (!mix?.tracks.length) return;
		player.playNow(mix.tracks[0], mix.tracks);
	}

	function shuffle() {
		if (!mix?.tracks.length) return;
		const list = [...mix.tracks];
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
		player.playNow(list[0], list);
	}

	function saveName(event: SubmitEvent) {
		event.preventDefault();
		if (mix) mixes.rename(mix.id, name);
		renaming = false;
	}

	function remove() {
		if (!mix) return;
		if (!confirmDelete) {
			confirmDelete = true;
			setTimeout(() => (confirmDelete = false), 3200);
			return;
		}
		mixes.remove(mix.id);
		void goto('/mixes');
	}

	/* ---------- drag to reorder ---------- */
	function dragStart(event: DragEvent, i: number) {
		dragFrom = i;
		event.dataTransfer?.setData('text/plain', String(i));
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}
	function dragOverRow(event: DragEvent, i: number) {
		if (dragFrom === null) return;
		event.preventDefault();
		if (i !== dragFrom) dragOver = i;
	}
	function dropRow(event: DragEvent, i: number) {
		event.preventDefault();
		if (mix && dragFrom !== null && dragFrom !== i) mixes.move(mix.id, dragFrom, i);
		dragFrom = null;
		dragOver = null;
	}
	function nudge(event: KeyboardEvent, i: number) {
		if (!mix) return;
		if (event.key === 'ArrowUp' && i > 0) {
			event.preventDefault();
			mixes.move(mix.id, i, i - 1);
		}
		if (event.key === 'ArrowDown' && i < mix.tracks.length - 1) {
			event.preventDefault();
			mixes.move(mix.id, i, i + 1);
		}
	}
</script>

<svelte:head>
	<title>{mix?.name ? `${mix.name} — FLAVOURS` : 'mix — FLAVOURS'}</title>
</svelte:head>

{#if !mix}
	<section class="card missing">
		<h1 class="display">that mix is gone</h1>
		<p class="muted">it may have been deleted on another device.</p>
		<button class="btn btn--accent" onclick={() => goto('/mixes')}>
			<Icon name="list" size={15} /> all mixes
		</button>
	</section>
{:else}
	<div class="mix-page">
		<section class="card head">
			<div class="mosaic">
				{#if arts.length >= 4}
					{#each arts as src, i (src + i)}<img {src} alt="" referrerpolicy="no-referrer" />{/each}
				{:else if arts.length}
					<img class="single" src={arts[0]} alt="" referrerpolicy="no-referrer" />
				{:else}
					<Icon name="disc" size={30} stroke={1.8} />
				{/if}
			</div>

			<div class="info">
				<span class="label mono">your mix</span>
				{#if renaming}
					<form class="rename" onsubmit={saveName}>
						<input
							class="input"
							bind:value={name}
							bind:this={renameInput}
							aria-label="Mix name"
							autocomplete="off"
						/>
						<button class="btn btn--accent" type="submit">save</button>
						<button class="btn btn--ghost" type="button" onclick={() => (renaming = false)}>
							cancel
						</button>
					</form>
				{:else}
					<h1 class="display truncate" title={mix.name}>{mix.name}</h1>
				{/if}
				<span class="mono meta-line">
					{mix.tracks.length} {mix.tracks.length === 1 ? 'track' : 'tracks'}
					{#if runtime}· {formatRuntime(runtime)}{/if}
					· updated {new Date(mix.updatedAt).toLocaleDateString()}
				</span>
				<div class="actions">
					<button class="btn btn--accent" onclick={play} disabled={!mix.tracks.length}>
						<Icon name="play" size={15} /> play
					</button>
					<button class="btn" onclick={shuffle} disabled={!mix.tracks.length}>
						<Icon name="shuffle" size={15} /> shuffle
					</button>
					<button class="btn btn--icon" title="Rename" onclick={() => (renaming = true)}>
						<Icon name="pencil" size={15} />
					</button>
					<button
						class="btn delete"
						class:confirm={confirmDelete}
						title="Delete this mix"
						onclick={remove}
					>
						<Icon name="trash" size={15} /> {confirmDelete ? 'really delete?' : 'delete'}
					</button>
				</div>
			</div>
		</section>

		{#if !mix.tracks.length}
			<section class="card empty">
				<h2 class="display">this mix is empty</h2>
				<p class="muted">
					hit <Icon name="plus" size={12} /> on any search result to add it here, or save a whole
					album.
				</p>
				<button class="btn btn--accent" onclick={() => goto('/search')}>
					<Icon name="search" size={15} /> find tracks
				</button>
			</section>
		{:else}
			<ul class="card list">
				{#each mix.tracks as track, i (track.id + ':' + i)}
					{@const active = player.current?.id === track.id}
					<li
						class="row"
						class:active
						class:dragging={dragFrom === i}
						class:drop={dragOver === i}
						animate:flip={{ duration: 180 }}
						draggable="true"
						ondragstart={(event) => dragStart(event, i)}
						ondragover={(event) => dragOverRow(event, i)}
						ondrop={(event) => dropRow(event, i)}
						ondragend={() => {
							dragFrom = null;
							dragOver = null;
						}}
					>
						<span class="grip" title="Drag to reorder" aria-hidden="true"><Icon name="grip" size={14} /></span>
						<button
							class="hit squircle"
							onclick={() => player.playNow(track, mix.tracks)}
							onkeydown={(event) => nudge(event, i)}
							title={active ? 'Playing now' : 'Play'}
						>
							<span class="idx">
								{#if active}
									<span class="eq" class:paused={!player.isPlaying}><i></i><i></i><i></i><i></i></span>
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
						<button
							class="btn btn--icon remove"
							title="Remove from this mix"
							aria-label="Remove “{track.title}” from this mix"
							onclick={() => mixes.removeTrack(mix.id, i)}
						>
							<Icon name="x" size={15} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.mix-page {
		display: grid;
		gap: clamp(14px, 1.8vw, 20px);
		min-width: 0;
	}
	.head {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: clamp(16px, 2vw, 24px);
		align-items: center;
		padding: clamp(14px, 1.8vw, 20px);
	}
	.mosaic {
		display: grid;
		grid-template-columns: 1fr 1fr;
		place-items: center;
		gap: 4px;
		width: 168px;
		aspect-ratio: 1;
		padding: 4px;
		border: 2px solid var(--ink);
		border-radius: 24px;
		background: linear-gradient(
			132deg,
			color-mix(in srgb, var(--accent) 22%, var(--surface-2)),
			color-mix(in srgb, var(--pop) 26%, var(--surface-2))
		);
		box-shadow: var(--shadow-sm);
		color: var(--muted);
		overflow: hidden;
	}
	.mosaic img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 14px;
	}
	.mosaic img.single {
		grid-column: 1 / -1;
		grid-row: 1 / -1;
		width: 100%;
		height: 100%;
	}
	.info {
		display: grid;
		gap: 7px;
		min-width: 0;
	}
	.info .display {
		font-size: clamp(1.6rem, 3.2vw, 2.3rem);
	}
	.label {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.meta-line {
		font-size: 0.76rem;
		color: var(--muted);
	}
	.rename {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}
	.rename .input {
		flex: 1;
		min-width: 180px;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		margin-top: 4px;
	}
	.actions .btn--icon {
		width: 42px;
		height: 42px;
	}
	.delete.confirm {
		background: var(--pop);
		color: var(--pop-ink, var(--ink));
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 6px 14px 12px;
	}
	.row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
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
	}
	.row.dragging {
		opacity: 0.45;
	}
	.row.drop {
		outline: 3px dashed var(--accent);
		outline-offset: -3px;
		border-radius: 14px;
	}
	.grip {
		display: grid;
		place-items: center;
		width: 18px;
		color: var(--muted);
		cursor: grab;
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.row:hover .grip,
	.row:focus-within .grip {
		opacity: 1;
	}
	.hit {
		display: grid;
		grid-template-columns: 26px 44px minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		padding: 7px 6px;
		border-radius: 13px;
		cursor: pointer;
		text-align: left;
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
		font-size: 0.8rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.row.active .idx {
		color: var(--accent);
	}
	.thumb {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		object-fit: cover;
		border: 2px solid var(--ink);
		border-radius: 12px;
		background: var(--surface-2);
		color: var(--muted);
	}
	.meta {
		display: grid;
		min-width: 0;
		line-height: 1.18;
	}
	.meta strong {
		font-size: 0.92rem;
	}
	.meta em {
		font-style: normal;
		font-size: 0.76rem;
		color: var(--muted);
	}
	.dur {
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--muted);
	}
	.remove {
		width: 32px;
		height: 32px;
		border-radius: 11px;
	}
	.empty,
	.missing {
		display: grid;
		justify-items: center;
		gap: 9px;
		padding: clamp(30px, 5vw, 52px) 20px;
		text-align: center;
	}
	.empty h2,
	.missing h1 {
		font-size: 1.35rem;
	}
	.empty p,
	.missing p {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-wrap: wrap;
		justify-content: center;
		max-width: 44ch;
	}
	@media (max-width: 640px) {
		.head {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
			text-align: center;
		}
		.actions {
			justify-content: center;
		}
		.hit {
			grid-template-columns: 22px 40px minmax(0, 1fr);
		}
		.hit .dur {
			display: none;
		}
	}
	@media (hover: none) {
		.grip {
			display: none;
		}
		.row {
			grid-template-columns: minmax(0, 1fr) auto;
		}
	}
</style>
