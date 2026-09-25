<script lang="ts">
	import { player } from '$lib/player.svelte';
	import QueuePanel from './QueuePanel.svelte';
	import ResultsList from './ResultsList.svelte';
	import SearchPanel from './SearchPanel.svelte';

	let tab = $state<'results' | 'queue'>('results');
</script>

<section class="card browse">
	<header class="tabs">
		<button
			class="tab display"
			class:active={tab === 'results'}
			onclick={() => (tab = 'results')}>results</button
		>
		<button class="tab display" class:active={tab === 'queue'} onclick={() => (tab = 'queue')}>
			queue
			{#if player.queue.length}<span class="count">{player.queue.length}</span>{/if}
		</button>
	</header>
	<div class="body">
		{#if tab === 'results'}
			<SearchPanel />
			<ResultsList />
		{:else}
			<QueuePanel />
		{/if}
	</div>
</section>

<style>
	.browse {
		padding: 0;
		overflow: hidden;
	}
	.tabs {
		display: flex;
		gap: 8px;
		padding: 16px 16px 12px;
		border-bottom: var(--bw) solid var(--ink);
		background: var(--surface-2);
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 1rem;
		border: var(--bw) solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface);
		box-shadow: 3px 3px 0 var(--ink);
		font-size: 0.95rem;
		cursor: pointer;
		transition:
			transform var(--t),
			box-shadow var(--t),
			background-color 0.3s ease,
			color 0.3s ease;
	}
	.tab:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 var(--ink);
	}
	.tab:active {
		transform: translate(2px, 2px);
		box-shadow: 0 0 0 var(--ink);
	}
	.tab.active {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.count {
		display: inline-grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		padding: 0 5px;
		background: var(--pop);
		color: var(--pop-ink, var(--ink));
		border: 2px solid currentColor;
		border-radius: var(--pill);
		font-size: 0.75rem;
	}
	.body {
		display: grid;
		gap: 12px;
		padding: 14px 16px 18px;
	}
	@media (min-width: 901px) {
		.body {
			max-height: calc(100vh - 300px);
			overflow-y: auto;
		}
	}
</style>
