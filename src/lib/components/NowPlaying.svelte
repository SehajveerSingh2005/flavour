<script lang="ts">
	import { formatTime } from '$lib/format';
	import { player } from '$lib/player.svelte';
	import { QUICK } from '$lib/quick';
	import { search } from '$lib/search.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { ui } from '$lib/ui.svelte';
	import Icon from './Icon.svelte';

	let dragging = $state<number | null>(null);
	let artFailed = $state(false);
	let lastArt = '';

	const track = $derived(player.current);
	const collapsed = $derived(ui.deckMini);
	const shownPosition = $derived(dragging ?? player.position);
	const pct = $derived(player.duration > 0 ? (shownPosition / player.duration) * 100 : 0);
	const loading = $derived(player.status === 'loading' || player.status === 'buffering');
	const volumePct = $derived((player.muted ? 0 : player.volume) * 100);
	const volumeIcon = $derived(
		player.muted || player.volume === 0 ? 'volume-x' : player.volume < 0.5 ? 'volume-low' : 'volume-high'
	);
	const queuePos = $derived(
		player.queue.length > 1 ? `${player.index + 1} / ${player.queue.length}` : ''
	);

	$effect(() => {
		const src = track?.art ?? '';
		if (src !== lastArt) {
			lastArt = src;
			artFailed = false;
			dragging = null;
		}
	});

	/** Empty deck: lucky takes the typed query, or gambles on a quick pick. */
	async function lucky() {
		const typed = search.query.trim();
		const q = typed.length > 1 ? typed : QUICK[Math.floor(Math.random() * QUICK.length)];
		search.setQuery(q);
		const tracks = await search.run(q);
		if (!tracks.length && !search.error) {
			toasts.push('Nothing found — try different words', 'error');
			return;
		}
		if (tracks[0]) player.playNow(tracks[0], tracks);
	}
</script>

<section class="card np">
	{#if track && collapsed}
		<!-- compact bar: the poster steps aside while the queue is open -->
		<div class="bar">
			<span class="bar-art-wrap">
				<span class="bar-disc" aria-hidden="true"></span>
				<button
					class="bar-art squircle"
					onclick={() => player.setImmersive(true)}
					title="Watch the video (F)"
					aria-label="Watch the video"
				>
					{#if track.art && !artFailed}
						<img src={track.art} alt="" referrerpolicy="no-referrer" onerror={() => (artFailed = true)} />
					{:else}
						<Icon name="music" size={16} />
					{/if}
				</button>
			</span>
			<span class="bar-meta">
				<strong class="truncate" title={track.title}>{track.title}</strong>
				<em class="truncate" title={track.artist}>{track.artist}</em>
			</span>
			{#if player.isPlaying}
				<span class="eq" class:paused={loading} aria-hidden="true"><i></i><i></i><i></i><i></i></span>
			{/if}
			<button
				class="btn btn--icon bar-btn"
				title="Back to the poster"
				aria-expanded="false"
				onclick={() => ui.toggleDeck()}
			>
				<Icon name="chevron-up" size={16} />
			</button>
			<button
				class="btn play play--sm squircle"
				data-state={player.isPlaying ? 'playing' : 'paused'}
				title="Play / pause (space)"
				aria-label="Play or pause"
				onclick={() => player.togglePlay()}
			>
				{#if loading}<span class="spinner"></span>{:else}<Icon
						name={player.isPlaying ? 'pause' : 'play'}
						size={18}
						stroke={2.4}
					/>{/if}
			</button>
		</div>
	{:else if track}
		<!-- the poster: art with the record slipping out, text over a gradient -->
		<div class="poster">
			<div class="disc" class:spinning={player.isPlaying} aria-hidden="true"></div>
			<button
				class="poster-art squircle"
				onclick={() => player.setImmersive(true)}
				title="Watch the video (F)"
				aria-label="Watch the video"
			>
				{#if track.art && !artFailed}
					<img src={track.art} alt="" referrerpolicy="no-referrer" onerror={() => (artFailed = true)} />
				{:else}
					<span class="art-fallback"><Icon name="music" size={44} /></span>
				{/if}
				<span class="overlay">
					<span class="overlay-label mono">
						now playing{queuePos ? ` · ${queuePos}` : ''}
					</span>
					<strong class="overlay-title display truncate" title={track.title}>{track.title}</strong>
					<em class="overlay-artist truncate" title={track.artist}>{track.artist}</em>
				</span>
				<span class="art-hint"><Icon name="maximize" size={13} /> watch</span>
			</button>
		</div>

		<div class="scrub-row">
			<span class="time mono">{formatTime(shownPosition)}</span>
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
			<span class="time mono">−{formatTime(Math.max(player.duration - shownPosition, 0))}</span>
		</div>

		<div class="transport">
			<button
				class="btn btn--icon"
				class:btn--on={player.shuffle}
				title="Shuffle (S)"
				aria-label="Shuffle"
				onclick={() => player.toggleShuffle()}
			>
				<Icon name="shuffle" size={17} />
			</button>
			<button class="btn btn--icon" title="Previous (P)" aria-label="Previous track" onclick={() => player.prev()}>
				<Icon name="skip-back" size={18} />
			</button>
			<button
				class="btn play squircle"
				data-state={player.isPlaying ? 'playing' : 'paused'}
				title="Play / pause (space)"
				aria-label="Play or pause"
				onclick={() => player.togglePlay()}
			>
				{#if loading}<span class="spinner"></span>{:else}<Icon
						name={player.isPlaying ? 'pause' : 'play'}
						size={24}
						stroke={2.4}
					/>{/if}
			</button>
			<button class="btn btn--icon" title="Next (N)" aria-label="Next track" onclick={() => player.next()}>
				<Icon name="skip-forward" size={18} />
			</button>
			<button
				class="btn btn--icon"
				class:btn--on={player.repeat !== 'off'}
				title="Repeat (R)"
				aria-label="Repeat mode"
				onclick={() => player.cycleRepeat()}
			>
				<Icon name={player.repeat === 'one' ? 'repeat-one' : 'repeat'} size={17} />
			</button>
		</div>

		<div class="utils">
			<button class="btn btn--icon tiny" title="Mute (M)" aria-label="Mute" onclick={() => player.toggleMute()}>
				<Icon name={volumeIcon} size={16} />
			</button>
			<input
				class="slider vol"
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={player.muted ? 0 : player.volume}
				style="--pct:{volumePct}%"
				oninput={(event) => player.setVolume(Number(event.currentTarget.value))}
				aria-label="Volume"
			/>
			<button
				class="btn btn--icon tiny watch"
				title="Watch the video (F)"
				aria-label="Watch the video"
				onclick={() => player.setImmersive(true)}
			>
				<Icon name="maximize" size={16} />
			</button>
		</div>
	{:else}
		<!-- quiet deck: the welcome hero lives on home now -->
		<div class="quiet">
			<div class="quiet-art" aria-hidden="true">
				<span class="quiet-disc"></span>
				<span class="quiet-cover squircle"><Icon name="disc" size={22} stroke={1.8} /></span>
			</div>
			<h2 class="display">nothing on the deck</h2>
			<p class="muted">Pick something fresh above, or let lucky gamble for you.</p>
			<button class="btn btn--accent" onclick={lucky}>
				<Icon name="sparkles" size={15} /> lucky
			</button>
		</div>
	{/if}
</section>

<style>
	.np {
		position: relative;
		display: grid;
		gap: 10px;
		padding: clamp(12px, 1.4vw, 16px);
		overflow: hidden;
	}
	.poster,
	.bar,
	.scrub-row,
	.transport,
	.utils,
	.quiet {
		position: relative;
		z-index: 1;
	}

	/* ---------- the poster ---------- */
	.poster {
		position: relative;
		width: 100%;
	}
	.disc {
		position: absolute;
		bottom: 1.5%;
		right: 1.5%;
		width: 78%;
		aspect-ratio: 1;
		z-index: 0;
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
			radial-gradient(circle at 50% 50%, #4d4d5c 0 16%, #1c1c26 17% 97%, #31313f 98% 100%);
		/* the surface ring keeps the record readable next to dark artwork */
		box-shadow:
			0 0 0 3px var(--surface),
			var(--shadow-sm);
		animation: disc-spin 8s linear infinite;
		animation-play-state: paused;
		transition: right 0.45s var(--ease-pop);
	}
	.disc.spinning {
		animation-play-state: running;
	}
	.poster:hover .disc {
		right: 0%;
	}
	@keyframes disc-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	.poster-art {
		position: relative;
		z-index: 1;
		display: block;
		/* the sleeve leaves a gutter on the right for the record */
		width: calc(100% - 12%);
		aspect-ratio: 1;
		padding: 0;
		border: var(--bw) solid var(--ink);
		border-radius: 24px;
		overflow: hidden;
		background: var(--surface-2);
		box-shadow: var(--shadow);
		cursor: pointer;
		transform: rotate(-1deg);
		transition:
			transform 0.32s var(--ease-pop),
			box-shadow 0.32s var(--ease-pop);
	}
	.poster-art:hover {
		transform: rotate(0deg) translate(-2px, -3px);
		box-shadow: var(--shadow-lg);
	}
	.poster-art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.art-fallback {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		color: var(--muted);
	}
	.overlay {
		position: absolute;
		inset: auto 0 0 0;
		display: grid;
		gap: 2px;
		padding: 34px 12px 12px;
		text-align: left;
		background: linear-gradient(transparent, rgb(12 16 10 / 0.85));
		color: #f6fbea;
		pointer-events: none;
	}
	.overlay-label {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: rgb(246 251 234 / 0.72);
	}
	.overlay-title {
		font-size: clamp(1.05rem, 2.6vw, 1.3rem);
		line-height: 1.05;
	}
	.overlay-artist {
		font-style: normal;
		font-size: 0.8rem;
		color: rgb(246 251 234 / 0.82);
	}
	.art-hint {
		position: absolute;
		top: 10px;
		right: 10px;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 10px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface);
		font-size: 0.72rem;
		font-weight: 700;
		opacity: 0;
		transform: translateY(-6px);
		transition:
			opacity 0.2s ease,
			transform 0.3s var(--ease-pop);
	}
	.poster-art:hover .art-hint,
	.poster-art:focus-visible .art-hint {
		opacity: 1;
		transform: none;
	}
	@media (hover: none) {
		.art-hint {
			display: none;
		}
	}

	/* ---------- controls ---------- */
	.scrub-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 9px;
	}
	.time {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.transport {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
	}
	.transport .btn--icon {
		width: 38px;
		height: 38px;
		border-radius: 13px;
		font-size: 0.95rem;
	}
	.play {
		width: 50px;
		height: 50px;
		padding: 0;
		border-radius: 16px;
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow: var(--shadow-sm);
	}
	.play:hover {
		box-shadow: var(--shadow);
	}
	/* this button grows its shadow on hover, so the press must collapse it —
	   otherwise the button and shadow slide down together instead of clicking */
	.play:active {
		box-shadow: 0 0 0 var(--ink);
	}
	.play--sm {
		width: 42px;
		height: 42px;
		border-radius: 14px;
	}
	.play .spinner {
		width: 17px;
		height: 17px;
		border-width: 3px;
	}
	.utils {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.utils .tiny {
		width: 32px;
		height: 32px;
		border-radius: 11px;
		font-size: 0.85rem;
	}
	.utils .vol {
		flex: 1;
		min-width: 0;
	}

	/* ---------- compact bar ---------- */
	.bar {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto auto auto;
		align-items: center;
		gap: 9px;
	}
	.bar-art-wrap {
		position: relative;
		width: 46px;
		height: 46px;
		margin-right: 6px;
	}
	.bar-disc {
		position: absolute;
		top: 54%;
		left: 58%;
		width: 56%;
		aspect-ratio: 1;
		z-index: 0;
		border: 2px solid var(--ink);
		border-radius: 50%;
		background: radial-gradient(circle at 50% 50%, #4d4d5c 0 16%, #1c1c26 17% 97%, #31313f 98%);
	}
	.bar-art {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 2px solid var(--ink);
		border-radius: 14px;
		overflow: hidden;
		background: var(--surface-2);
		color: var(--muted);
		box-shadow: var(--shadow-sm);
		cursor: pointer;
	}
	.bar-art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.bar-meta {
		display: grid;
		min-width: 0;
		line-height: 1.15;
	}
	.bar-meta strong {
		font-size: 0.9rem;
	}
	.bar-meta em {
		font-style: normal;
		font-size: 0.74rem;
		color: var(--muted);
	}
	.bar-btn {
		width: 34px;
		height: 34px;
		border-radius: 12px;
	}

	/* ---------- quiet deck ---------- */
	.quiet {
		display: grid;
		justify-items: center;
		gap: 7px;
		padding: 10px 6px 12px;
		text-align: center;
	}
	.quiet-art {
		position: relative;
		width: 76px;
		aspect-ratio: 1;
		margin: 2px 14px 10px 0;
	}
	.quiet-disc {
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
	}
	.quiet-cover {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border: var(--bw) solid var(--ink);
		border-radius: 22px;
		background: var(--surface-2);
		color: var(--muted);
		box-shadow: var(--shadow-sm);
	}
	.quiet h2 {
		font-size: 1.1rem;
	}
	.quiet p {
		font-size: 0.8rem;
		max-width: 28ch;
	}
</style>
