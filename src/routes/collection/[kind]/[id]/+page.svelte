<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import TrackMenu from '$lib/components/TrackMenu.svelte';
	import { formatDuration, formatRuntime } from '$lib/format';
	import { history } from '$lib/history.svelte';
	import { likes } from '$lib/likes.svelte';
	import { mixes } from '$lib/mixes.svelte';
	import { player } from '$lib/player.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import type { Track } from '$lib/types';

	interface Payload {
		kind: 'album' | 'playlist';
		title: string;
		subtitle: string;
		artist: string;
		art: string;
		tracks: Track[];
	}

	const kind = $derived(page.params.kind === 'playlist' ? 'playlist' : 'album');
	const id = $derived(page.params.id ?? '');
	const label = $derived(kind === 'album' ? 'album' : 'playlist');

	let data = $state<Payload | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		const type = kind;
		const collectionId = id;
		data = null;
		error = null;
		if (!collectionId) return;
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch(
					`/api/collection?type=${type}&id=${encodeURIComponent(collectionId)}`
				);
				if (!res.ok) throw new Error(`Could not load that ${type}`);
				const payload = (await res.json()) as Payload;
				if (!cancelled) data = payload;
			} catch (e) {
				if (!cancelled) error = e instanceof Error ? e.message : `Could not load that ${type}`;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	const tracks = $derived(data?.tracks ?? []);
	const runtime = $derived(tracks.reduce((sum, track) => sum + (track.duration || 0), 0));
	const art = $derived(data?.art || tracks[0]?.art || '');
	/** the header line — artist, then “Album • 2015”, then the counts */
	const meta = $derived(
		data
			? [
					data.artist && !data.subtitle.toLowerCase().includes(data.artist.toLowerCase())
						? data.artist
						: '',
					data.subtitle
				].filter(Boolean)
			: []
	);

	/** Opening the whole thing is what lands in recently played. */
	function remember() {
		if (!data) return;
		history.recordCollection(kind, {
			id,
			title: data.title,
			subtitle: meta.join(' · ') || data.subtitle,
			art
		});
	}

	function playAll() {
		if (!tracks.length) return;
		remember();
		player.playNow(tracks[0], tracks);
	}

	function shuffle() {
		if (!tracks.length) return;
		remember();
		const list = [...tracks];
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
		player.playNow(list[0], list);
	}

	function playFrom(index: number) {
		const track = tracks[index];
		if (!track) return;
		remember();
		player.playNow(track, tracks);
	}

	function saveMix() {
		if (!data || !tracks.length) return;
		const mix = mixes.create(data.title, tracks);
		toasts.push(`saved as “${mix.name}” · ${tracks.length} tracks`, 'accent');
	}

	const liked = $derived(data ? likes.hasCollection(kind, id) : false);

	function toggleLike() {
		if (!data) return;
		const likedNow = likes.toggleCollection({
			kind,
			id,
			title: data.title,
			subtitle: meta.join(' · ') || data.subtitle,
			art
		});
		toasts.push(
			likedNow ? `liked “${data.title}”` : `took “${data.title}” out of likes`,
			likedNow ? 'accent' : 'info'
		);
	}
</script>

<svelte:head>
	<title>{data ? `${data.title} — FLAVOURS` : `${label} — FLAVOURS`}</title>
</svelte:head>

{#if error}
	<section class="card missing">
		<h1 class="display">couldn’t open that {label}</h1>
		<p class="muted">{error} — it may have been removed, or the link is off.</p>
		<div class="missing-row">
			<button class="btn btn--accent" onclick={() => goto('/search')}>
				<Icon name="search" size={15} /> back to search
			</button>
		</div>
	</section>
{:else if !data}
	<section class="card missing">
		<span class="spinner"></span>
		<p class="muted">loading the {label}…</p>
	</section>
{:else}
	<div class="collection-page">
		<section class="card head">
			<div class="mosaic">
				{#if art}
					<img class="single" src={art} alt="" referrerpolicy="no-referrer" />
				{:else}
					<Icon name={kind === 'album' ? 'disc' : 'list'} size={30} stroke={1.8} />
				{/if}
			</div>

			<div class="info">
				<span class="label mono">{label}</span>
				<h1 class="display truncate" title={data.title}>{data.title}</h1>
				<span class="mono meta-line">
					{#if meta.length}{meta.join(' · ')} · {/if}{tracks.length}
					{tracks.length === 1 ? 'track' : 'tracks'}
					{#if runtime}· {formatRuntime(runtime)}{/if}
				</span>
				<div class="actions">
					<button class="btn btn--accent" onclick={playAll}>
						<Icon name="play" size={15} /> play
					</button>
					<button class="btn" onclick={shuffle}>
						<Icon name="shuffle" size={15} /> shuffle
					</button>
					<button
						class="btn"
						class:btn--on={liked}
						onclick={toggleLike}
						title={liked ? 'Remove from likes' : 'Add to likes'}
					>
						<Icon name={liked ? 'heart-filled' : 'heart'} size={15} />
						{liked ? 'liked' : 'like'}
					</button>
					<button class="btn" onclick={saveMix} title="Save the whole thing as a mix">
						<Icon name="plus" size={15} /> save as mix
					</button>
				</div>
			</div>
		</section>

		<ul class="card list">
			{#each tracks as track, i (track.id + ':' + i)}
				{@const active = player.current?.id === track.id}
				<li class="row" class:active>
					<button class="hit squircle" onclick={() => playFrom(i)} title="Play from here">
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
					<TrackMenu {track} />
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.collection-page {
		display: grid;
		gap: clamp(14px, 1.8vw, 20px);
		min-width: 0;
	}
	.head {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: clamp(16px, 2vw, 26px);
		align-items: center;
		padding: clamp(14px, 1.8vw, 20px);
	}
	.mosaic {
		display: grid;
		place-items: center;
		width: 168px;
		aspect-ratio: 1;
		border: 2px solid var(--ink);
		border-radius: 24px;
		background: linear-gradient(
			132deg,
			color-mix(in srgb, var(--accent) 22%, var(--surface-2)),
			color-mix(in srgb, var(--accent) 26%, var(--surface-2))
		);
		box-shadow: var(--shadow-sm);
		color: var(--muted);
		overflow: hidden;
	}
	.mosaic img {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
		letter-spacing: 0.09em;
		color: var(--muted);
	}
	.meta-line {
		font-size: 0.74rem;
		color: var(--muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 4px;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 8px 12px 12px;
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
	.missing {
		display: grid;
		justify-items: center;
		gap: 9px;
		padding: clamp(30px, 5vw, 52px) 20px;
		text-align: center;
	}
	.missing h1 {
		font-size: 1.35rem;
	}
	.missing p {
		max-width: 44ch;
	}
	.missing-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 6px;
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
</style>
