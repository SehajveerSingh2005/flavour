<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onboarding } from '$lib/onboarding.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		open: boolean;
	}

	let { open = $bindable() }: Props = $props();
	let sheet = $state<HTMLElement | null>(null);

	$effect(() => {
		if (open) sheet?.focus();
	});

	const GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
		{
			title: 'playback',
			rows: [
				['space', 'play / pause'],
				['← →', 'seek ±5 seconds'],
				['↑ ↓', 'volume'],
				['n / p', 'next / previous'],
				['m', 'mute'],
				['s', 'shuffle'],
				['r', 'repeat mode'],
				['l', 'lyrics']
			]
		},
		{
			title: 'view',
			rows: [
				['f', 'immersive video'],
				['/', 'jump to search'],
				['?', 'this cheat sheet'],
				['esc', 'close overlays']
			]
		}
	];
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="scrim"
		role="presentation"
		transition:fade={{ duration: 150 }}
		onclick={(event) => {
			if (event.target === event.currentTarget) open = false;
		}}
	>
		<div
			class="sheet card"
			bind:this={sheet}
			role="dialog"
			aria-modal="true"
			aria-label="Keyboard shortcuts"
			tabindex="-1"
			transition:fly={{ y: 16, duration: 220 }}
		>
			<header>
				<span class="badge">cheat sheet</span>
				<h2 class="display">keyboard shortcuts</h2>
				<span class="grow"></span>
				<button class="btn btn--icon" title="Close" aria-label="Close" onclick={() => (open = false)}>
					<Icon name="x" size={17} />
				</button>
			</header>

			<div class="grid">
				{#each GROUPS as group (group.title)}
					<section>
						<h3 class="mono">{group.title}</h3>
						<ul>
							{#each group.rows as [key, what] (key)}
								<li><kbd>{key}</kbd><span>{what}</span></li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>

			<footer class="muted mono">
				<button
					class="again"
					onclick={() => {
						open = false;
						onboarding.show();
					}}
				>
					show the intro again
				</button>
				<span class="sep">·</span>
				<span>press ? any time — esc closes</span>
			</footer>
		</div>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 110;
		display: grid;
		place-items: center;
		padding: 20px;
		background: color-mix(in srgb, var(--bg) 62%, transparent);
		backdrop-filter: blur(8px);
	}
	.sheet {
		width: min(560px, 100%);
		max-height: min(86vh, 620px);
		overflow: auto;
		padding: 20px;
		display: grid;
		gap: 16px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	header h2 {
		font-size: 1.25rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
		gap: 18px;
	}
	section h3 {
		margin: 0 0 8px;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}
	section ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 7px;
	}
	section li {
		display: grid;
		grid-template-columns: minmax(64px, auto) 1fr;
		align-items: center;
		gap: 12px;
		font-size: 0.88rem;
		font-weight: 600;
	}
	section li span {
		color: var(--muted);
	}
	footer {
		border-top: 2px dashed var(--faint);
		padding-top: 12px;
		font-size: 0.72rem;
		text-align: center;
	}
	.again {
		border: 0;
		background: none;
		font: inherit;
		color: var(--accent);
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}
	.sep {
		padding: 0 6px;
		opacity: 0.6;
	}
</style>
