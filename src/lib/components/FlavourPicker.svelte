<script lang="ts">
	import { FLAVOURS, getFlavour } from '$lib/flavours';
	import { theme } from '$lib/theme.svelte';
	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';

	let open = $state(false);
	let wrap = $state<HTMLDivElement | null>(null);

	const active = $derived(getFlavour(theme.current));

	function onDocClick(event: MouseEvent) {
		if (!open || !wrap) return;
		if (!wrap.contains(event.target as Node)) open = false;
	}
</script>

<svelte:window
	onclick={onDocClick}
	onkeydown={(event) => {
		if (event.key === 'Escape') open = false;
	}}
/>

<div class="picker" bind:this={wrap}>
	<button
		class="btn picker-btn"
		onclick={() => (open = !open)}
		aria-expanded={open}
		aria-haspopup="true"
	>
		<span class="swatch" style="--a:{active.swatch[0]}; --b:{active.swatch[1]}"></span>
		<span class="label">{active.name}</span>
		<span class="caret" class:up={open}><Icon name="chevron-down" size={14} /></span>
	</button>

	{#if open}
		<div class="menu card" transition:fly={{ y: -10, duration: 180 }}>
			<p class="menu-title display">pick a flavour</p>
			<ul class="list">
				{#each FLAVOURS as flavour (flavour.id)}
					<li>
						<button
							class="row squircle"
							class:active={flavour.id === theme.current}
							onclick={() => {
								theme.set(flavour.id);
								open = false;
							}}
						>
							<span
								class="swatch big"
								style="--a:{flavour.swatch[0]}; --b:{flavour.swatch[1]}"
							></span>
							<span class="text">
								<strong>{flavour.name}</strong>
								<em>{flavour.note}</em>
							</span>
							{#if flavour.id === theme.current}
								<span class="tick"><Icon name="check" size={16} /></span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}
	.picker-btn {
		gap: 0.55rem;
	}
	.swatch {
		width: 22px;
		height: 22px;
		border: 2px solid var(--ink);
		border-radius: 7px;
		background: linear-gradient(135deg, var(--a) 50%, var(--b) 50%);
	}
	.swatch.big {
		width: 34px;
		height: 34px;
		border-radius: 10px;
	}
	.caret {
		display: grid;
		place-items: center;
		transition: transform 0.2s ease;
	}
	.caret.up {
		transform: rotate(180deg);
	}
	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + 12px);
		width: 284px;
		padding: 14px;
		z-index: 50;
	}
	.menu-title {
		font-size: 0.95rem;
		margin-bottom: 0.5rem;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 4px;
		max-height: 330px;
		overflow: auto;
	}
	.row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.7rem;
		align-items: center;
		width: 100%;
		padding: 0.45rem 0.55rem;
		border: 2px solid transparent;
		border-radius: 14px;
		cursor: pointer;
		text-align: left;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}
	.row:hover {
		background: var(--surface-2);
	}
	.row.active {
		border-color: var(--ink);
		background: var(--accent-soft);
	}
	.text {
		display: grid;
		line-height: 1.15;
	}
	.text strong {
		font-size: 0.92rem;
	}
	.text em {
		font-style: normal;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.tick {
		display: grid;
		place-items: center;
		color: var(--accent);
	}
	@media (max-width: 560px) {
		.label {
			display: none;
		}
	}
</style>
