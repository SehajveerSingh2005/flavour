<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import FlavourPicker from '$lib/components/FlavourPicker.svelte';
	import MiniPlayer from '$lib/components/MiniPlayer.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import VideoDock from '$lib/components/VideoDock.svelte';
	import { player } from '$lib/player.svelte';
	import { search } from '$lib/search.svelte';
	import { theme } from '$lib/theme.svelte';

	let { children } = $props();

	onMount(() => {		theme.init();
		search.hydrate();

		function onKey(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
			) {
				return;
			}
			switch (event.key) {
				case ' ':
				case 'k':
					event.preventDefault();
					player.togglePlay();
					break;
				case 'ArrowRight':
					event.preventDefault();
					player.seek(player.position + 5);
					break;
				case 'ArrowLeft':
					event.preventDefault();
					player.seek(player.position - 5);
					break;
				case 'ArrowUp':
					event.preventDefault();
					player.setVolume(player.volume + 0.05);
					break;
				case 'ArrowDown':
					event.preventDefault();
					player.setVolume(player.volume - 0.05);
					break;
				case 'n':
				case 'N':
					player.next();
					break;
				case 'p':
				case 'P':
					player.prev();
					break;
				case 'm':
				case 'M':
					player.toggleMute();
					break;
				case 'f':
				case 'F':
					player.toggleImmersive();
					break;
				case '/':
					event.preventDefault();
					document.getElementById('search-input')?.focus();
					break;
				case 'Escape':
					if (player.immersive) player.setImmersive(false);
					break;
			}
		}

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<header class="topbar">
		<a class="wordmark display" href="/">FLAVOUR</a>
		<span class="tagline muted">music, freshly squeezed</span>
		<div class="spacer"></div>
		<FlavourPicker />
	</header>
	<main class="main">
		{@render children()}
	</main>
	<footer class="footer muted">
		<span>space play</span>
		<span>←→ seek</span>
		<span>↑↓ volume</span>
		<span>n/p track</span>
		<span>m mute</span>
		<span>f immersive</span>
		<span>/ search</span>
	</footer>
</div>

<VideoDock />
<MiniPlayer />
<Toaster />

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	.topbar {
		position: sticky;
		top: 0;
		z-index: 65;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 13px clamp(16px, 4vw, 34px);
		background: color-mix(in srgb, var(--bg) 86%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: var(--bw) solid var(--ink);
		transition:
			background-color 0.4s ease,
			border-color 0.3s ease;
	}
	.wordmark {
		display: inline-block;
		padding: 5px 14px;
		background: var(--accent);
		color: var(--accent-ink);
		border: var(--bw) solid var(--ink);
		border-radius: 18px;
		box-shadow: var(--shadow-sm);
		font-size: 1.22rem;
		text-decoration: none;
		transform: rotate(-1.5deg);
		animation: sticker-in 0.5s var(--ease-pop) both;
		transition:
			transform var(--t),
			box-shadow var(--t),
			background-color 0.3s ease,
			color 0.3s ease;
	}
	.wordmark:hover {
		transform: rotate(0deg) scale(1.03);
		box-shadow: 6px 6px 0 var(--ink);
	}
	.tagline {
		font-size: 0.9rem;
		font-weight: 600;
	}
	.spacer {
		flex: 1;
	}
	.main {
		flex: 1;
		width: 100%;
		max-width: 1240px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 28px) clamp(16px, 4vw, 34px) 96px;
	}
	.footer {
		display: flex;
		justify-content: center;
		gap: 16px;
		flex-wrap: wrap;
		padding: 14px;
		border-top: 2px dashed var(--faint);
		font-size: 0.75rem;
		font-weight: 600;
	}
	@media (max-width: 700px) {
		.tagline,
		.footer {
			display: none;
		}
	}
</style>
