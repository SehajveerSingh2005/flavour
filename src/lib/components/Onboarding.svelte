<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { FLAVOURS } from '$lib/flavours';
	import { theme } from '$lib/theme.svelte';
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
			<!-- left: the poster -->
			<div class="poster">
				<span class="stamp display">fresh!</span>

				<div class="scene" aria-hidden="true">
					<span class="disc"></span>
					<span class="sleeve squircle"><Icon name="music" size={34} stroke={1.8} /></span>
				</div>

				<div class="brand">
					<span class="wordmark display">FLAVOURS</span>
					<span class="tag mono">music, freshly squeezed</span>
				</div>

				<div class="taster">
					<span class="label mono">pick a flavour</span>
					<ul class="dots">
						{#each FLAVOURS as flavour (flavour.id)}
							<li>
								<button
									class="dot"
									class:on={theme.current === flavour.id}
									style="--dot-bg:{flavour.swatch[0]};--dot-accent:{flavour.swatch[1]}"
									title="{flavour.name} — {flavour.note}"
									aria-label="Try the {flavour.name} flavour"
									onclick={() => theme.set(flavour.id)}
								></button>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- right: the pitch -->
			<div class="pitch">
				<header class="pitch-top">
					<span class="badge">welcome</span>
					<span class="grow"></span>
					<button class="btn btn--icon" title="Close" aria-label="Close" onclick={ondismiss}>
						<Icon name="x" size={17} />
					</button>
				</header>

				<h2 class="display">press play on something delicious</h2>
				<p class="lead">
					A keyless YouTube music player — search anything, keep what you love, and the video stays
					out of the way.
				</p>

				<ul class="stickers">
					<li class="sticker a">
						<span class="ico"><Icon name="search" size={16} /></span>
						<strong>search it</strong>
						<em>type in the topbar, or paste a YouTube link</em>
					</li>
					<li class="sticker b">
						<span class="ico"><Icon name="heart" size={16} /></span>
						<strong>keep it</strong>
						<em>hearts and mixes live together on the shelf</em>
					</li>
					<li class="sticker c">
						<span class="ico"><Icon name="radio" size={16} /></span>
						<strong>leave it playing</strong>
						<em>autoplay radio keeps the queue going</em>
					</li>
				</ul>

				<footer class="actions">
					<button class="btn btn--accent go" onclick={start}>
						<Icon name="sparkles" size={15} /> start listening
					</button>
					<button class="btn btn--ghost" onclick={ondismiss}>later</button>
					<span class="hint mono">press <kbd>?</kbd> any time</span>
				</footer>
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
		padding: 24px;
		background: color-mix(in srgb, var(--bg) 62%, transparent);
		backdrop-filter: blur(8px);
	}
	.sheet {
		display: grid;
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
		width: min(920px, 100%);
		max-height: min(92vh, 680px);
		padding: 0;
		border-radius: 26px;
		/* clip the poster into the rounded corners — content keeps its own scroll */
		overflow: hidden;
		outline: none;
	}

	/* ---------- the poster half ---------- */
	.poster {
		position: relative;
		display: grid;
		align-content: center;
		justify-items: center;
		gap: clamp(14px, 2vw, 22px);
		padding: clamp(20px, 3vw, 30px) 22px;
		border-right: var(--bw) solid var(--ink);
		background:
			radial-gradient(color-mix(in srgb, var(--ink) 9%, transparent) 1.3px, transparent 1.3px) 0 0 /
				13px 13px,
			linear-gradient(
				160deg,
				color-mix(in srgb, var(--accent) 14%, var(--surface)),
				color-mix(in srgb, var(--accent) 34%, var(--surface-2))
			);
	}
	.stamp {
		position: absolute;
		top: 16px;
		left: 16px;
		padding: 3px 12px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--pop);
		color: var(--pop-ink, var(--ink));
		font-size: 0.9rem;
		transform: rotate(-7deg);
		box-shadow: 3px 3px 0 var(--ink);
	}

	.scene {
		position: relative;
		width: clamp(150px, 15vw, 188px);
		aspect-ratio: 1.12;
	}
	.disc {
		position: absolute;
		right: 0;
		bottom: 2%;
		width: 82%;
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
		box-shadow:
			0 0 0 3px var(--surface),
			var(--shadow-sm);
		animation: spin-slow 14s linear infinite;
	}
	@keyframes spin-slow {
		to {
			transform: rotate(360deg);
		}
	}
	.sleeve {
		position: absolute;
		left: 0;
		top: 3%;
		display: grid;
		place-items: center;
		width: 72%;
		aspect-ratio: 1;
		border: var(--bw) solid var(--ink);
		border-radius: 26px;
		background: var(--surface);
		color: var(--accent);
		box-shadow: var(--shadow);
		transform: rotate(-2.5deg);
	}
	@media (prefers-reduced-motion: reduce) {
		.disc {
			animation: none;
		}
	}

	.brand {
		display: grid;
		justify-items: center;
		gap: 7px;
	}
	.wordmark {
		padding: 5px 16px;
		background: var(--accent);
		color: var(--accent-ink);
		border: var(--bw) solid var(--ink);
		border-radius: 18px;
		box-shadow: var(--shadow-sm);
		font-size: 1.4rem;
		transform: rotate(-1.5deg);
	}
	.tag {
		font-size: 0.74rem;
		color: var(--muted);
	}

	.taster {
		display: grid;
		justify-items: center;
		gap: 9px;
		padding: 10px 14px 12px;
		border: 2px dashed var(--ink);
		border-radius: 16px;
		background: color-mix(in srgb, var(--surface) 72%, transparent);
	}
	.label {
		font-size: 0.66rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--muted);
	}
	.dots {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin: 0;
		padding: 2px 0;
	}
	.dot {
		position: relative;
		width: 26px;
		height: 26px;
		padding: 0;
		border: 2px solid var(--ink);
		border-radius: 50%;
		background: var(--dot-bg);
		box-shadow: 2px 2px 0 var(--ink);
		cursor: pointer;
		transition:
			transform var(--t),
			box-shadow var(--t);
	}
	.dot::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: 50%;
		background: var(--dot-accent);
	}
	.dot:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 var(--ink);
	}
	.dot.on {
		transform: translate(-1px, -1px) scale(1.14);
		box-shadow: 4px 4px 0 var(--ink);
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}

	/* ---------- the pitch half ---------- */
	.pitch {
		display: grid;
		align-content: start;
		gap: clamp(14px, 1.8vw, 18px);
		min-width: 0;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: clamp(20px, 2.4vw, 26px) clamp(20px, 2.6vw, 28px) 30px;
		scrollbar-width: thin;
	}
	.pitch-top {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.pitch h2 {
		font-size: clamp(1.7rem, 3.4vw, 2.5rem);
		max-width: 16ch;
	}
	.lead {
		margin: -6px 0 0;
		font-size: 0.94rem;
		color: var(--muted);
		max-width: 46ch;
	}

	.stickers {
		list-style: none;
		margin: 2px 0;
		padding: 4px 2px;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 14px;
	}
	.sticker {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 4px 11px;
		padding: 11px 13px;
		border: var(--bw) solid var(--ink);
		border-radius: 17px;
		box-shadow: var(--shadow-sm);
		transition: transform var(--t);
	}
	.sticker:hover {
		transform: rotate(0deg) translate(-1px, -2px);
	}
	.sticker.a {
		transform: rotate(-1.4deg);
		background: var(--surface);
	}
	.sticker.b {
		transform: rotate(1.1deg);
		background: color-mix(in srgb, var(--accent) 16%, var(--surface));
	}
	.sticker.c {
		transform: rotate(-0.8deg);
		background: color-mix(in srgb, var(--pop) 18%, var(--surface));
	}
	.ico {
		grid-row: span 2;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 2px solid var(--ink);
		border-radius: 12px;
		background: var(--surface-2);
		box-shadow: 2px 2px 0 var(--ink);
		color: var(--accent);
	}
	.sticker strong {
		font-size: 0.92rem;
	}
	.sticker em {
		font-style: normal;
		font-size: 0.76rem;
		color: var(--muted);
	}

	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
	}
	.go {
		flex: 1 1 auto;
		justify-content: center;
		padding: 0.75rem 1.1rem;
		font-size: 0.98rem;
	}
	.hint {
		margin-left: auto;
		font-size: 0.7rem;
		color: var(--muted);
	}

	/* ---------- phones: poster on top, pitch below ---------- */
	@media (max-width: 780px) {
		.sheet {
			grid-template-columns: minmax(0, 1fr);
			max-height: 92vh;
			overflow-y: auto;
		}
		.poster {
			border-right: 0;
			border-bottom: var(--bw) solid var(--ink);
			padding: 18px 16px 16px;
			gap: 12px;
		}
		.scene {
			width: clamp(120px, 34vw, 150px);
		}
		.stamp {
			top: 10px;
			left: 10px;
			font-size: 0.8rem;
		}
		.wordmark {
			font-size: 1.15rem;
		}
		.pitch {
			overflow: visible;
			padding: 18px 18px 26px;
		}
		.pitch h2 {
			font-size: clamp(1.5rem, 7vw, 2rem);
		}
		.hint {
			margin-left: 0;
			width: 100%;
		}
	}
</style>
