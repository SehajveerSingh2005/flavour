<script lang="ts">
	import { formatTime } from '$lib/format';
	import { player } from '$lib/player.svelte';

	let dragging = $state<number | null>(null);
	let artFailed = $state(false);
	let lastArt = '';

	const track = $derived(player.current);
	const shownPosition = $derived(dragging ?? player.position);
	const pct = $derived(player.duration > 0 ? (shownPosition / player.duration) * 100 : 0);
	const loading = $derived(player.status === 'loading' || player.status === 'buffering');

	$effect(() => {
		const src = track?.art ?? '';
		if (src !== lastArt) {
			lastArt = src;
			artFailed = false;
			dragging = null;
		}
	});
</script>

<section class="card np">
	<header class="np-top">
		<span class="badge">now playing</span>
		{#if track}
			<span class="muted small">{player.index + 1} / {player.queue.length}</span>
		{/if}
	</header>

	{#if track}
		<div class="art-wrap" class:playing={player.isPlaying && !player.immersive}>
			<button class="art-btn" title="Watch the video" onclick={() => player.setImmersive(true)}>
				{#if track.art && !artFailed}
					<img
						class="art squircle"
						src={track.art}
						alt=""
						referrerpolicy="no-referrer"
						onerror={() => (artFailed = true)}
					/>
				{:else}
					<span class="art fallback squircle">🎧</span>
				{/if}
			</button>
			<button class="watch btn" onclick={() => player.setImmersive(true)}>watch ⛶</button>
		</div>

		<div class="info">
			<h1 class="title display truncate" title={track.title}>{track.title}</h1>
			<p class="artist muted truncate" title={track.artist}>{track.artist}</p>
		</div>

		<div class="scrubber">
			<input
				class="slider"
				type="range"
				min="0"
				max={Math.max(player.duration, 1)}
				step="1"
				value={shownPosition}
				style="--pct:{pct}%"
				oninput={(event) => (dragging = Number(event.currentTarget.value))}
				onchange={(event) => {
					player.seek(Number(event.currentTarget.value));
					dragging = null;
				}}
				aria-label="Seek"
			/>
			<div class="times">
				<span>{formatTime(shownPosition)}</span>
				<span>{formatTime(player.duration)}</span>
			</div>
		</div>

		<div class="transport">
			<button
				class="btn btn--icon"
				class:btn--on={player.shuffle}
				title="Shuffle"
				onclick={() => player.toggleShuffle()}>🔀</button
			>
			<button class="btn btn--icon" title="Previous (P)" onclick={() => player.prev()}>⏮</button>
			<button
				class="btn btn--icon play squircle"
				class:loading
				title="Play / pause (space)"
				onclick={() => player.togglePlay()}
			>
				{loading ? '•••' : player.isPlaying ? '⏸' : '▶'}
			</button>
			<button class="btn btn--icon" title="Next (N)" onclick={() => player.next()}>⏭</button>
			<button
				class="btn btn--icon"
				class:btn--on={player.repeat !== 'off'}
				title="Repeat"
				onclick={() => player.cycleRepeat()}>{player.repeat === 'one' ? '🔂' : '🔁'}</button
			>
		</div>

		<div class="volume">
			<button
				class="btn btn--icon tiny"
				title="Mute (M)"
				onclick={() => player.toggleMute()}
			>
				{player.muted || player.volume === 0 ? '🔇' : '🔊'}
			</button>
			<input
				class="slider"
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={player.muted ? 0 : player.volume}
				style="--pct:{(player.muted ? 0 : player.volume) * 100}%"
				oninput={(event) => player.setVolume(Number(event.currentTarget.value))}
				aria-label="Volume"
			/>
		</div>
	{:else}
		<div class="empty">
			<div class="empty-art squircle">🍧</div>
			<h1 class="display">nothing on the menu</h1>
			<p class="muted">
				search a song and press play — or let the <strong>lucky</strong> button pick for you.
			</p>
		</div>
	{/if}
</section>

<style>
	.np {
		padding: 18px;
		display: grid;
		gap: 16px;
	}
	.np-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
	}
	.small {
		font-size: 0.78rem;
		font-weight: 600;
	}
	.art-wrap {
		position: relative;
	}
	.art-btn {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}
	.art {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border: var(--bw) solid var(--ink);
		border-radius: var(--radius);
		background: var(--surface-2);
		box-shadow: var(--shadow);
	}
	.art.fallback {
		display: grid;
		place-items: center;
		font-size: 4.5rem;
	}
	.art-wrap.playing .art {
		animation: breathe 4s ease-in-out infinite;
	}
	.watch {
		position: absolute;
		right: 12px;
		bottom: 12px;
		opacity: 0;
		transform: translateY(6px);
		transition:
			opacity 0.2s ease,
			transform 0.2s ease;
	}
	.art-wrap:hover .watch,
	.watch:focus-visible {
		opacity: 1;
		transform: none;
	}
	/* touch screens have no hover — keep the affordance visible */
	@media (hover: none) {
		.watch {
			opacity: 1;
			transform: none;
		}
	}
	.info {
		display: grid;
		gap: 2px;
		min-width: 0;
	}
	.title {
		font-size: clamp(1.35rem, 2.4vw, 1.9rem);
	}
	.artist {
		font-size: 0.95rem;
	}
	.scrubber {
		display: grid;
		gap: 2px;
	}
	.times {
		display: flex;
		justify-content: space-between;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.transport {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}
	.play {
		width: 64px;
		height: 64px;
		border-radius: 22px;
		background: var(--accent);
		color: var(--accent-ink);
		font-size: 1.7rem;
		box-shadow: var(--shadow);
	}
	.play:hover {
		box-shadow: 8px 8px 0 var(--ink);
	}
	.play.loading {
		animation: breathe 0.9s ease-in-out infinite;
	}
	.volume {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 10px;
		max-width: 260px;
		justify-self: center;
		width: 100%;
	}
	.tiny {
		width: 38px;
		height: 38px;
		font-size: 0.9rem;
	}
	.empty {
		display: grid;
		justify-items: center;
		gap: 10px;
		text-align: center;
		padding: 26px 10px 16px;
	}
	.empty-art {
		width: 120px;
		height: 120px;
		display: grid;
		place-items: center;
		font-size: 3rem;
		background: var(--surface-2);
		border: var(--bw) solid var(--ink);
		border-radius: 38px;
		box-shadow: var(--shadow-sm);
		margin-bottom: 8px;
	}
	.empty h1 {
		font-size: 1.5rem;
	}
	.empty p {
		max-width: 34ch;
	}
</style>
