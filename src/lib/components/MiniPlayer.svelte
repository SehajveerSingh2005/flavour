<script lang="ts">
	import { onMount } from 'svelte';
	import { player } from '$lib/player.svelte';
	import Icon from './Icon.svelte';

	const loading = $derived(player.status === 'loading' || player.status === 'buffering');

	// On desktop the shell keeps the stage in view; if a short window still
	// lets it scroll away, dock a mini player so controls stay reachable.
	let fallback = $state(false);

	onMount(() => {
		const hero = document.querySelector('.np');
		if (!hero || typeof IntersectionObserver === 'undefined') return;
		const observer = new IntersectionObserver(
			([entry]) => (fallback = !entry.isIntersecting),
			{ threshold: 0.2 }
		);
		observer.observe(hero);
		return () => observer.disconnect();
	});
</script>

{#if player.current}
	<div class="mini" class:fallback>
		<div class="progress"><span style="width:{player.progress * 100}%"></span></div>
		<div class="inner">
			<button
				class="art-btn"
				onclick={() => player.setImmersive(true)}
				title="Watch the video"
				aria-label="Watch the video"
			>
				{#if player.current.art}
					<img class="art squircle" src={player.current.art} alt="" referrerpolicy="no-referrer" />
				{:else}
					<span class="art fallback squircle"><Icon name="music" size={20} /></span>
				{/if}
			</button>
			<div class="meta">
				<strong class="truncate">{player.current.title}</strong>
				<em class="truncate">{player.current.artist}</em>
			</div>
			<div class="controls">
				<button
					class="btn btn--icon"
					title="Previous"
					aria-label="Previous track"
					onclick={() => player.prev()}
				>
					<Icon name="skip-back" size={17} />
				</button>
				<button
					class="btn play"
					data-state={player.isPlaying ? 'playing' : 'paused'}
					title="Play / pause"
					aria-label="Play or pause"
					onclick={() => player.togglePlay()}
				>
					{#if loading}
						<span class="spinner"></span>
					{:else}
						<Icon name={player.isPlaying ? 'pause' : 'play'} size={20} stroke={2.4} />
					{/if}
				</button>
				<button class="btn btn--icon" title="Next" aria-label="Next track" onclick={() => player.next()}>
					<Icon name="skip-forward" size={17} />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.mini {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 70;
		display: none;
		background: var(--surface);
		border-top: var(--bw) solid var(--ink);
		box-shadow: 0 -5px 0 var(--faint);
	}
	.progress {
		height: 5px;
		background: var(--surface-2);
	}
	.progress span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 0.25s linear;
	}
	.inner {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 10px;
		padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
	}
	.art-btn {
		cursor: pointer;
	}
	.art {
		width: 46px;
		height: 46px;
		object-fit: cover;
		border: 2px solid var(--ink);
		border-radius: 14px;
		background: var(--surface-2);
	}
	.art.fallback {
		display: grid;
		place-items: center;
		color: var(--muted);
	}
	.meta {
		display: grid;
		min-width: 0;
		line-height: 1.15;
	}
	.meta strong {
		font-size: 0.9rem;
	}
	.meta em {
		font-style: normal;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.controls .btn {
		width: 38px;
		height: 38px;
		font-size: 0.9rem;
		border-radius: 13px;
	}
	.controls .play {
		width: 48px;
		height: 48px;
		background: var(--accent);
		color: var(--accent-ink);
		border-radius: 16px;
	}
	.controls .spinner {
		width: 15px;
		height: 15px;
		border-width: 2.5px;
	}
	@media (max-width: 900px) {
		.mini {
			display: block;
		}
	}
	@media (min-width: 901px) {
		.mini.fallback {
			display: block;
		}
	}
	@media (max-width: 420px) {
		.controls .btn:not(.play) {
			display: none;
		}
	}
</style>