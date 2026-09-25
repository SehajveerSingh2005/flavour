<script lang="ts">
	import BrowsePanel from '$lib/components/BrowsePanel.svelte';
	import NowPlaying from '$lib/components/NowPlaying.svelte';
</script>

<svelte:head>
	<title>FLAVOUR — music, freshly squeezed</title>
</svelte:head>

<div class="home">
	<div class="stage"><NowPlaying /></div>
	<BrowsePanel />
</div>

<style>
	.home {
		display: grid;
		grid-template-columns: minmax(330px, 400px) minmax(0, 1fr);
		gap: clamp(16px, 2.4vw, 26px);
		align-items: start;
	}
	.stage {
		position: sticky;
		top: 96px;
	}
	@media (max-width: 900px) {
		.home {
			grid-template-columns: 1fr;
		}
		.stage {
			position: static;
		}
	}
</style>
