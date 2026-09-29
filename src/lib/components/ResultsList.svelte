<script lang="ts">
	import { formatDuration } from '$lib/format';
	import { player } from '$lib/player.svelte';
	import { search } from '$lib/search.svelte';
	import Icon from './Icon.svelte';
	import TrackMenu from './TrackMenu.svelte';
</script>

{#if search.loading && !search.results.length}
	<ul class="rows">
		{#each Array(5) as _, i (i)}
			<li class="row skeleton">
				<span class="sk-idx"></span>
				<span class="sk-art"></span>
				<span class="sk-meta">
					<span class="sk-line wide"></span>
					<span class="sk-line short"></span>
				</span>
			</li>
		{/each}
	</ul>
{:else if search.results.length}
	<ul class="rows">
		{#each search.results as track, i (track.id + ':' + i)}
			{@const active = player.current?.id === track.id}
			<li class="row" class:active>
				<button class="hit squircle" onclick={() => player.playNow(track, search.results)} title="Play">
					<span class="idx">
						{#if active}
							<span class="eq" class:paused={!player.isPlaying}><i></i><i></i><i></i><i></i></span>
						{:else}
							{i + 1}
						{/if}
					</span>
					<img
						class="thumb squircle"
						src={track.art}
						alt=""
						loading="lazy"
						referrerpolicy="no-referrer"
					/>
					<span class="meta">
						<strong class="truncate">{track.title}</strong>
						<em class="truncate">{track.artist}</em>
					</span>
					{#if track.source === 'video'}
						<span class="badge">yt</span>
					{/if}
					<span class="dur mono">{formatDuration(track.duration)}</span>
				</button>
				<div class="actions">
					<button
						class="btn btn--icon"
						title="Play next"
						aria-label="Play “{track.title}” next"
						onclick={() => player.addNext(track)}
					>
						<Icon name="play-next" size={16} />
					</button>
					<TrackMenu {track} />
				</div>
			</li>
		{/each}
	</ul>
{:else}
	<div class="placeholder">
		{#if search.lastQuery}
			<p class="display">no luck with “{search.lastQuery}”</p>
			<p class="muted">try fewer words, or just the artist name.</p>
		{:else}
			<p class="display">nothing here yet</p>
			<p class="muted">
				type something above — song, artist, or a vibe. the <strong>lucky</strong> button
				plays the top hit straight away.
			</p>
		{/if}
	</div>
{/if}

<style>
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 6px;
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
		grid-template-columns: 30px 46px 1fr auto auto;
		align-items: center;
		gap: 10px;
		padding: 7px 8px;
		border-radius: 14px;
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
		font-size: 0.85rem;
		color: var(--muted);
	}
	.row.active .idx {
		color: var(--accent);
	}
	.thumb {
		width: 46px;
		height: 46px;
		object-fit: cover;
		border: 2px solid var(--ink);
		border-radius: 12px;
		background: var(--surface-2);
	}
	.meta {
		display: grid;
		min-width: 0;
		line-height: 1.2;
	}
	.meta strong {
		font-size: 0.95rem;
	}
	.meta em {
		font-style: normal;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.dur {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.actions {
		display: flex;
		gap: 6px;
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.row:hover .actions,
	.actions:focus-within {
		opacity: 1;
	}
	.actions .btn {
		width: 34px;
		height: 34px;
		font-size: 0.9rem;
		border-radius: 12px;
	}
	.placeholder {
		padding: 34px 16px;
		display: grid;
		gap: 8px;
		justify-items: center;
		text-align: center;
	}
	.placeholder .display {
		font-size: 1.3rem;
	}
	.placeholder p.muted {
		max-width: 46ch;
	}

	/* skeletons */
	.skeleton {
		grid-template-columns: 30px 46px 1fr;
		padding: 9px 8px;
	}
	.sk-idx,
	.sk-art,
	.sk-line {
		background: var(--surface-2);
		animation: pulse 1.2s ease-in-out infinite;
	}
	.sk-idx {
		width: 16px;
		height: 12px;
		justify-self: center;
		border-radius: 4px;
	}
	.sk-art {
		width: 46px;
		height: 46px;
		border-radius: 12px;
	}
	.sk-meta {
		display: grid;
		gap: 6px;
	}
	.sk-line {
		height: 12px;
		border-radius: 4px;
	}
	.sk-line.wide {
		width: 60%;
	}
	.sk-line.short {
		width: 34%;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.55;
		}
	}
	@media (max-width: 640px) {
		.hit {
			grid-template-columns: 24px 42px 1fr auto;
		}
		.hit .badge {
			display: none;
		}
		.actions {
			opacity: 1;
		}
	}
</style>
