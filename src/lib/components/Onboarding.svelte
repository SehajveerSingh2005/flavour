<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { FLAVOURS } from '$lib/flavours';
	import Icon from './Icon.svelte';

	interface Props {
		open: boolean;
		/** closing always goes through the store so the flag is written */
		ondismiss: () => void;
	}

	let { open, ondismiss }: Props = $props();
	let sheet = $state<HTMLElement | null>(null);

	$effect(() => {
		if (open) sheet?.focus();
	});

	/** Same as dismiss, but land the cursor in the search field. */
	function start() {
		ondismiss();
		requestAnimationFrame(() => document.getElementById('search-input')?.focus());
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="scrim"
		role="presentation"
		transition:fade={{ duration: 150 }}
		onclick={(event) => {
			if (event.target === event.currentTarget) ondismiss();
		}}
	>
		<div
			class="sheet card onboarding"
			bind:this={sheet}
			role="dialog"
			aria-modal="true"
			aria-label="Welcome to Flavours"
			tabindex="-1"
			transition:fly={{ y: 18, duration: 240 }}
		>
			<header class="topline">
				<span class="badge">welcome</span>
				<span class="grow"></span>
				<button class="btn btn--icon" title="Close" aria-label="Close" onclick={ondismiss}>
					<Icon name="x" size={17} />
				</button>
			</header>

			<h2 class="display">music, freshly squeezed</h2>
			<p class="lead">
				Flavours is a keyless YouTube music player — search anything, queue it up, and keep the
				video out of the way until you want it.
			</p>

			<ul class="steps">
				<li>
					<span class="ico"><Icon name="search" size={16} /></span>
					<div>
						<strong>search anything</strong>
						<p>type in the topbar, or paste a YouTube link to play it straight away.</p>
					</div>
				</li>
				<li>
					<span class="ico"><Icon name="list" size={16} /></span>
					<div>
						<strong>queue, mixes &amp; likes</strong>
						<p>no account, no cloud — everything stays in this browser.</p>
					</div>
				</li>
				<li>
					<span class="ico"><Icon name="radio" size={16} /></span>
					<div>
						<strong>autoplay radio</strong>
						<p>when the queue runs dry, YouTube's up-next keeps the music going.</p>
					</div>
				</li>
				<li>
					<span class="ico"><Icon name="help" size={16} /></span>
					<div>
						<strong>press ?</strong>
						<p>the cheat sheet lists every shortcut, and can replay this tour.</p>
					</div>
				</li>
			</ul>

			<div class="flavour-row">
				<span class="label mono">eight flavours</span>
				<ul class="dots">
					{#each FLAVOURS as flavour (flavour.id)}
						<li
							style="--dot-bg:{flavour.swatch[0]};--dot-accent:{flavour.swatch[1]}"
							title="{flavour.name} — {flavour.note}"
						></li>
					{/each}
				</ul>
				<span class="label mono">pick a mood, top right</span>
			</div>

			<div class="actions">
				<button class="btn btn--accent" onclick={start}>
					<Icon name="sparkles" size={15} /> start listening
				</button>
				<button class="btn btn--ghost" onclick={ondismiss}>later</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 115;
		display: grid;
		place-items: center;
		padding: 20px;
		background: color-mix(in srgb, var(--bg) 62%, transparent);
		backdrop-filter: blur(8px);
	}
	.sheet {
		width: min(580px, 100%);
		max-height: min(88vh, 640px);
		overflow: auto;
		padding: 20px 22px 22px;
		display: grid;
		gap: 14px;
	}
	.topline {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	h2 {
		font-size: clamp(1.4rem, 3vw, 1.8rem);
	}
	.lead {
		margin: 0;
		font-size: 0.94rem;
		color: var(--muted);
	}
	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.steps li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
		gap: 11px;
		padding: 9px 10px;
		border: 2px solid var(--faint);
		border-radius: 14px;
		background: color-mix(in srgb, var(--surface-2) 45%, transparent);
	}
	.ico {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 2px solid var(--ink);
		border-radius: 11px;
		background: var(--surface);
		box-shadow: 2px 2px 0 var(--ink);
		color: var(--accent);
	}
	.steps strong {
		font-size: 0.9rem;
	}
	.steps p {
		margin: 1px 0 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.flavour-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 10px 12px;
		border: 2px dashed var(--ink);
		border-radius: 14px;
	}
	.dots {
		list-style: none;
		display: flex;
		gap: 6px;
		margin: 0;
		padding: 0;
	}
	.dots li {
		width: 18px;
		height: 18px;
		border: 2px solid var(--ink);
		border-radius: 50%;
		background: var(--dot-bg);
		position: relative;
	}
	.dots li::after {
		content: '';
		position: absolute;
		inset: 3px;
		border-radius: 50%;
		background: var(--dot-accent);
	}
	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
	}
	.actions .btn--accent {
		flex: 1 1 auto;
		justify-content: center;
	}
</style>
