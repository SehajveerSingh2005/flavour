<script lang="ts">
	import { toasts } from '$lib/toasts.svelte';
	import { fly } from 'svelte/transition';
</script>

<div class="toaster">
	{#each toasts.items as toast (toast.id)}
		<button
			class="toast card"
			class:accent={toast.tone === 'accent'}
			class:error={toast.tone === 'error'}
			transition:fly={{ y: 16, duration: 200 }}
			onclick={() => toasts.dismiss(toast.id)}
			title="Dismiss"
		>
			{toast.text}
		</button>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		left: 18px;
		bottom: 18px;
		z-index: 90;
		display: grid;
		gap: 10px;
		max-width: min(360px, calc(100vw - 36px));
	}
	.toast {
		padding: 0.6rem 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		border-radius: 16px;
	}
	.toast.accent {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.toast.error {
		background: var(--pop);
		color: var(--pop-ink, var(--ink));
	}
	@media (max-width: 900px) {
		.toaster {
			bottom: 92px;
		}
	}
</style>
