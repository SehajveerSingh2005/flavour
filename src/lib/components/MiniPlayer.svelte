<script lang="ts">
	import { player } from '$lib/player.svelte';

	const loading = $derived(player.status === 'loading' || player.status === 'buffering');
</script>

{#if player.current}
	<div class="mini">
		<div class="progress"><span style="width:{player.progress * 100}%"></span></div>
		<div class="inner">
			<button
				class="art-btn"
				onclick={() => player.setImmersive(true)}
				title="Watch the video"
			>
				{#if player.current.art}
					<img class="art squircle" src={player.current.art} alt="" referrerpolicy="no-referrer" />
				{:else}
					<span class="art fallback squircle">🎧</span>
				{/if}
			</button>
			<div class="meta">
				<strong class="truncate">{player.current.title}</strong>
				<em class="truncate">{player.current.artist}</em>
			</div>
			<div class="controls">
				<button class="btn btn--icon" title="Previous" onclick={() => player.prev()}>⏮</button>
				<button class="btn btn--icon play" title="Play / pause" onclick={() => player.togglePlay()}>
					{loading ? '•••' : player.isPlaying ? '⏸' : '▶'}
				</button>
				<button class="btn btn--icon" title="Next" onclick={() => player.next()}>⏭</button>
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
		font-size: 1.2rem;
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
		font-size: 1.1rem;
		background: var(--accent);
		color: var(--accent-ink);
		border-radius: 16px;
	}
	@media (max-width: 900px) {
		.mini {
			display: block;
		}
	}
	@media (max-width: 420px) {
		.controls .btn:not(.play) {
			display: none;
		}
	}
</style>
