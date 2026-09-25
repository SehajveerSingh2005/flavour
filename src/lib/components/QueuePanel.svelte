<script lang="ts">
	import { flip } from 'svelte/animate';
	import { formatDuration } from '$lib/format';
	import { player } from '$lib/player.svelte';
</script>

{#if !player.queue.length}
	<div class="placeholder">
		<p class="display">the queue is empty</p>
		<p class="muted">
			hit <strong>+</strong> on a search result, or <strong>↳</strong> to play it next.
		</p>
	</div>
{:else}
	<header class="head">
		<p class="display"><strong>{player.queue.length}</strong> in the queue</p>
		<button class="btn" onclick={() => player.clearQueue()}>clear all</button>
	</header>
	<ul class="list">
		{#each player.queue as item, i (item.uid)}
			{@const active = i === player.index}
			<li class="row" class:active animate:flip={{ duration: 200 }}>
				<button class="hit squircle" onclick={() => player.playAt(i)} title="Play">
					<span class="idx">{active ? '▶' : i + 1}</span>
					<img
						class="thumb squircle"
						src={item.art}
						alt=""
						loading="lazy"
						referrerpolicy="no-referrer"
					/>
					<span class="meta">
						<strong class="truncate">{item.title}</strong>
						<em class="truncate">{item.artist}</em>
					</span>
					<span class="dur">{formatDuration(item.duration)}</span>
				</button>
				<div class="actions">
					<button
						class="btn btn--icon"
						title="Move up"
						disabled={i === 0}
						onclick={() => player.move(i, i - 1)}>↑</button
					>
					<button
						class="btn btn--icon"
						title="Move down"
						disabled={i === player.queue.length - 1}
						onclick={() => player.move(i, i + 1)}>↓</button
					>
					<button class="btn btn--icon" title="Remove" onclick={() => player.removeAt(i)}>✕</button>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 2px 4px 10px;
		border-bottom: 2px dashed var(--faint);
	}
	.head .display {
		font-size: 1rem;
	}
	.list {
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
		grid-template-columns: 30px 46px 1fr auto;
		align-items: center;
		gap: 10px;
		padding: 7px 8px;
		border-radius: 14px;
		cursor: pointer;
		text-align: left;
		min-width: 0;
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
	@media (max-width: 640px) {
		.hit {
			grid-template-columns: 24px 42px 1fr;
		}
		.dur {
			display: none;
		}
	}
</style>
