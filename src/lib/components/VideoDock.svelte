<script lang="ts">
	import { onMount } from 'svelte';
	import { player } from '$lib/player.svelte';

	onMount(() => {
		void player.mount('yt-host');
	});
</script>

<div class="dock" class:immersive={player.immersive}>
	<div class="frame squircle">
		<div id="yt-host"></div>
	</div>

	{#if player.immersive}
		<div class="caption">
			<span class="badge">now watching</span>
			<strong class="truncate">{player.current?.title ?? ''}</strong>
			<span class="muted truncate">{player.current?.artist ?? ''}</span>
			<button
				class="btn btn--icon"
				title="Exit immersive (F)"
				onclick={() => player.setImmersive(false)}>✕</button
			>
		</div>
	{/if}
</div>

<style>
	.dock {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: grid;
		place-items: center;
		pointer-events: none;
	}
	.dock::before {
		content: '';
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--bg) 74%, transparent);
		backdrop-filter: blur(14px);
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	.dock.immersive {
		pointer-events: auto;
	}
	.dock.immersive::before {
		opacity: 1;
	}
	.frame {
		position: relative;
		width: 320px;
		height: 180px;
		background: #000;
		border: var(--bw) solid transparent;
		border-radius: 28px;
		overflow: hidden;
		box-shadow: var(--shadow-lg);
		opacity: 0;
		transform: scale(0.8) translateY(24px);
		transition:
			width 0.42s var(--ease-pop),
			height 0.42s var(--ease-pop),
			opacity 0.3s ease,
			transform 0.42s var(--ease-pop),
			border-color 0.3s ease;
	}
	.dock.immersive .frame {
		width: min(92vw, 1120px);
		height: min(51.75vw, 630px);
		opacity: 1;
		transform: none;
		border-color: var(--ink);
	}
	.frame :global(#yt-host),
	.frame :global(#yt-host iframe) {
		width: 100% !important;
		height: 100% !important;
		display: block;
		border: 0;
	}
	.caption {
		position: absolute;
		bottom: 5vh;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.7rem;
		max-width: min(92vw, 1120px);
		padding: 0.45rem 0.6rem 0.45rem 0.8rem;
		border: var(--bw) solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface);
		box-shadow: var(--shadow-sm);
	}
	@media (max-width: 700px) {
		.caption {
			flex-wrap: wrap;
			gap: 0.4rem;
		}
	}
</style>
