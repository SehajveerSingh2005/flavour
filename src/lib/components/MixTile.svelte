<script lang="ts">
	import { formatRuntime } from '$lib/format';
	import type { Mix } from '$lib/mixes.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		mix: Mix;
		onclick?: () => void;
	}

	let { mix, onclick }: Props = $props();

	const arts = $derived(mix.tracks.map((track) => track.art).filter(Boolean).slice(0, 4));
	const runtime = $derived(mix.tracks.reduce((sum, track) => sum + (track.duration || 0), 0));
</script>

<button class="mix-tile" {onclick} title="Open “{mix.name}”">
	<span class="art squircle">
		{#if arts.length >= 4}
			<span class="mosaic">
				{#each arts as src, i (src + i)}<img {src} alt="" loading="lazy" referrerpolicy="no-referrer" />{/each}
			</span>
		{:else if arts.length}
			<img class="single" src={arts[0]} alt="" loading="lazy" referrerpolicy="no-referrer" />
		{:else}
			<Icon name="disc" size={26} stroke={1.8} />
		{/if}
	</span>
	<span class="meta">
		<strong class="truncate">{mix.name}</strong>
		<em class="truncate">
			{mix.tracks.length} {mix.tracks.length === 1 ? 'track' : 'tracks'}
			{#if runtime}· {formatRuntime(runtime)}{/if}
		</em>
	</span>
</button>

<style>
	.mix-tile {
		display: grid;
		gap: 9px;
		width: 100%;
		text-align: left;
		cursor: pointer;
	}
	.art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1;
		border: var(--bw) solid var(--ink);
		border-radius: 20px;
		overflow: hidden;
		background: linear-gradient(
			132deg,
			color-mix(in srgb, var(--accent) 22%, var(--surface-2)),
			color-mix(in srgb, var(--pop) 26%, var(--surface-2))
		);
		box-shadow: var(--shadow-sm);
		color: var(--muted);
		transition:
			transform var(--t),
			box-shadow var(--t);
	}
	.mix-tile:hover .art {
		transform: translate(-2px, -3px) rotate(-1deg);
		box-shadow: 6px 6px 0 var(--ink);
	}
	.art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.mosaic {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		width: 100%;
		height: 100%;
		gap: 2px;
	}
	.meta {
		display: grid;
		line-height: 1.2;
		min-width: 0;
	}
	.meta strong {
		font-size: 0.95rem;
	}
	.meta em {
		font-style: normal;
		font-size: 0.78rem;
		color: var(--muted);
	}
</style>
