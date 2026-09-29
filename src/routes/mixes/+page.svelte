<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import MixTile from '$lib/components/MixTile.svelte';
	import { mixes } from '$lib/mixes.svelte';

	let creating = $state(false);
	let name = $state('');

	function createMix(event: SubmitEvent) {
		event.preventDefault();
		const mix = mixes.create(name);
		creating = false;
		name = '';
		void goto(`/mixes/${mix.id}`);
	}
</script>

<svelte:head>
	<title>mixes — FLAVOURS</title>
</svelte:head>

<div class="mixes-page">
	<header class="page-head">
		<h1 class="display">mixes</h1>
		<span class="grow"></span>
		{#if !creating}
			<button class="btn btn--accent" onclick={() => (creating = true)}>
				<Icon name="plus" size={15} /> new mix
			</button>
		{/if}
	</header>

	{#if creating}
		<form class="card new-form" onsubmit={createMix}>
			<input
				class="input"
				placeholder="name your mix"
				bind:value={name}
				aria-label="Mix name"
				autocomplete="off"
			/>
			<button class="btn btn--accent" type="submit">create</button>
			<button class="btn btn--ghost" type="button" onclick={() => (creating = false)}>cancel</button>
		</form>
	{/if}

	{#if mixes.items.length}
		<ul class="tiles">
			{#each mixes.items as mix (mix.id)}
				<li><MixTile {mix} onclick={() => goto(`/mixes/${mix.id}`)} /></li>
			{/each}
		</ul>
	{:else if !creating}
		<section class="card empty">
			<div class="empty-art squircle"><Icon name="disc" size={26} stroke={1.8} /></div>
			<h2 class="display">no mixes yet</h2>
			<p class="muted">
				a mix is a snapshot of tracks you keep — build one by hand, or save any album or playlist
				from search.
			</p>
			<div class="empty-row">
				<button class="btn btn--accent" onclick={() => (creating = true)}>
					<Icon name="plus" size={15} /> new mix
				</button>
				<button class="btn" onclick={() => goto('/search')}>
					<Icon name="search" size={15} /> find tracks
				</button>
			</div>
		</section>
	{/if}
</div>

<style>
	.mixes-page {
		display: grid;
		gap: clamp(14px, 1.8vw, 20px);
		min-width: 0;
	}
	.page-head {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 2px 2px 0;
	}
	.page-head .display {
		font-size: clamp(1.7rem, 3.4vw, 2.4rem);
	}
	.new-form {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px;
	}
	.new-form .input {
		flex: 1;
	}
	.tiles {
		list-style: none;
		margin: 0;
		padding: 4px 4px 12px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: clamp(14px, 1.6vw, 20px);
	}
	.empty {
		display: grid;
		justify-items: center;
		gap: 9px;
		padding: clamp(30px, 5vw, 52px) 20px;
		text-align: center;
	}
	.empty-art {
		display: grid;
		place-items: center;
		width: 62px;
		height: 62px;
		border: var(--bw) solid var(--ink);
		border-radius: 22px;
		background: var(--surface-2);
		color: var(--muted);
		box-shadow: var(--shadow-sm);
	}
	.empty h2 {
		font-size: 1.35rem;
	}
	.empty p {
		max-width: 42ch;
	}
	.empty-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 6px;
	}
</style>
