<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import FlavourPicker from '$lib/components/FlavourPicker.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MiniPlayer from '$lib/components/MiniPlayer.svelte';
	import NowPlaying from '$lib/components/NowPlaying.svelte';
	import QueuePanel from '$lib/components/QueuePanel.svelte';
	import SearchField from '$lib/components/SearchField.svelte';
	import Shortcuts from '$lib/components/Shortcuts.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import VideoDock from '$lib/components/VideoDock.svelte';
	import { history } from '$lib/history.svelte';
	import { mixes } from '$lib/mixes.svelte';
	import { player } from '$lib/player.svelte';
	import { search } from '$lib/search.svelte';
	import { ui } from '$lib/ui.svelte';

	let { children } = $props();
	let help = $state(false);

	const path = $derived(page.url.pathname);
	const onSearch = $derived(path.startsWith('/search'));
	const onMixes = $derived(path.startsWith('/mixes'));

	onMount(() => {
		search.hydrate();
		history.hydrate();
		mixes.hydrate();
		ui.hydrate();

		function onKey(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
			) {
				return;
			}

			if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
				event.preventDefault();
				help = !help;
				return;
			}
			if (help) {
				if (event.key === 'Escape') help = false;
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
				case 's':
				case 'S':
					player.toggleShuffle();
					break;
				case 'r':
				case 'R':
					player.cycleRepeat();
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
		<nav class="nav" aria-label="Primary">
			<a class="nav-link" class:on={path === '/'} href="/">home</a>
			<a class="nav-link" class:on={onSearch} href="/search">search</a>
			<a class="nav-link" class:on={onMixes} href="/mixes">mixes</a>
		</nav>
		<div class="search-slot"><SearchField /></div>
		<span class="spacer"></span>
		{#if player.current}
			<span class="now mono truncate" title="{player.current.title} — {player.current.artist}">
				<span class="eq" class:paused={!player.isPlaying} aria-hidden="true"
					><i></i><i></i><i></i><i></i></span
				>
				{player.current.title}
			</span>
		{/if}
		<button class="btn btn--icon help" title="Keyboard shortcuts (?)" onclick={() => (help = true)}>
			<Icon name="help" size={17} />
			<span class="sr-only">Keyboard shortcuts</span>
		</button>
		<span class="picker-slot"><FlavourPicker /></span>
	</header>

	<main class="main">
		<div class="stage">
			<div class="content">
				{@render children()}
			</div>
			<aside class="rail" class:queue-open={ui.queueOpen}>
				<div class="player-slot"><NowPlaying /></div>
				<div class="queue-slot"><QueuePanel /></div>
			</aside>
		</div>
	</main>
</div>

<VideoDock />
<MiniPlayer />
<Shortcuts bind:open={help} />
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
		flex: none;
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
	.nav {
		display: flex;
		align-items: center;
		gap: 4px;
		flex: none;
	}
	.nav-link {
		padding: 7px 13px;
		border: 2px solid transparent;
		border-radius: var(--pill);
		font-size: 0.86rem;
		font-weight: 700;
		text-decoration: none;
		color: var(--muted);
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}
	.nav-link:hover {
		color: var(--ink);
	}
	.nav-link.on {
		background: var(--surface);
		border-color: var(--ink);
		color: var(--ink);
		box-shadow: 2px 2px 0 var(--ink);
	}
	.search-slot {
		flex: none;
		min-width: 0;
	}
	.spacer {
		flex: 1;
	}
	.now {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		max-width: min(300px, 22vw);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--muted);
	}
	.help {
		width: 42px;
		height: 42px;
	}
	.picker-slot {
		flex: none;
	}
	.main {
		flex: 1;
		width: 100%;
		max-width: 1320px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 28px) clamp(16px, 4vw, 34px) 90px;
		min-height: 0;
	}
	/* ---------- desktop: one locked stage, the rail never moves ---------- */
	@media (min-width: 961px) {
		.shell {
			height: 100dvh;
			min-height: 0;
			overflow: hidden;
		}
		.main {
			display: grid;
			min-height: 0;
			/* the scroll columns run to the window edge — their own bottom
			   padding carries the last card's breathing room */
			padding-bottom: 0;
		}
		.stage {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(320px, 366px);
			gap: clamp(16px, 2vw, 26px);
			height: 100%;
			min-height: 0;
		}
		.content {
			min-width: 0;
			min-height: 0;
			overflow-y: auto;
			overscroll-behavior: contain;
			/* paint the flavoured paper on the scroller itself: a scroll layer
			   that borrows the page background can keep a stale flavour cached
			   after a theme switch. fixed attachment keeps the dots aligned
			   with the page's own grid. */
			background-color: var(--bg);
			background-image: var(--paper);
			background-size: 24px 24px;
			background-attachment: fixed;
			/* room for the cards' hard shadows before the scroll clip */
			padding: 2px 10px 16px 2px;
		}
		.rail {
			display: grid;
			grid-template-rows: auto auto;
			gap: clamp(12px, 1.4vw, 18px);
			height: 100%;
			min-width: 0;
			min-height: 0;
			/* a short window scrolls the rail instead of clipping the deck */
			overflow-y: auto;
			background-color: var(--bg);
			background-image: var(--paper);
			background-size: 24px 24px;
			background-attachment: fixed;
			padding: 2px 10px 16px 2px;
			scrollbar-width: thin;
		}
		.rail.queue-open {
			grid-template-rows: auto minmax(0, 1fr);
		}
		.rail.queue-open .queue-slot {
			min-height: 0;
		}
		.player-slot,
		.queue-slot {
			display: grid;
			min-width: 0;
		}
	}
	/* ---------- mobile: document flow, deck under the page ---------- */
	@media (max-width: 960px) {
		.stage {
			display: contents;
		}
		.content {
			order: 0;
		}
		.player-slot {
			order: 1;
		}
		.queue-slot {
			order: 2;
		}
		.content,
		.player-slot,
		.queue-slot {
			min-width: 0;
		}
		.rail {
			display: contents;
		}
	}
	@media (max-width: 960px) {
		.topbar {
			flex-wrap: wrap;
			row-gap: 10px;
		}
		.nav {
			order: 4;
			flex-basis: 100%;
			justify-content: flex-start;
		}
		.search-slot {
			order: 2;
			flex: 1;
		}
		.spacer {
			display: none;
		}
		.wordmark {
			order: 1;
		}
		.help {
			order: 3;
		}
		.picker-slot {
			order: 3;
		}
	}
	@media (max-width: 640px) {
		/* the field drops to its own full-width row — squeezed into the first
		   row it had no room to show what you were typing */
		.search-slot {
			order: 2;
			flex-basis: 100%;
		}
		.help {
			order: 1;
			margin-left: auto;
		}
		.picker-slot {
			order: 1;
		}
	}
	@media (max-width: 700px) {
		.now {
			display: none;
		}
	}
</style>
