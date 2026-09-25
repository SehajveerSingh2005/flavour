<script lang="ts">
	import { player } from '$lib/player.svelte';
	import { search } from '$lib/search.svelte';
	import { toasts } from '$lib/toasts.svelte';

	let local = $state(search.query);
	let debounce: ReturnType<typeof setTimeout> | null = null;

	async function run(q: string) {
		const tracks = await search.run(q);
		if (!tracks.length && !search.error) {
			toasts.push('Nothing found — try different words', 'error');
		}
		return tracks;
	}

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (debounce) clearTimeout(debounce);
		void run(local);
	}

	function onInput() {
		if (debounce) clearTimeout(debounce);
		const q = local.trim();
		if (q.length < 3) return;
		debounce = setTimeout(() => void run(q), 550);
	}

	async function lucky() {
		const q = local.trim();
		if (q.length < 2) {
			toasts.push('Type a song first — then I’ll gamble');
			return;
		}
		if (debounce) clearTimeout(debounce);
		const tracks = await run(q);
		if (tracks[0]) player.playNow(tracks[0], tracks);
	}

	function pickRecent(q: string) {
		local = q;
		void run(q);
	}
</script>

<div class="panel">
	<form class="row" onsubmit={onSubmit}>
		<input
			id="search-input"
			class="input"
			bind:value={local}
			oninput={onInput}
			placeholder="song, artist, or a vibe…"
			autocomplete="off"
			spellcheck="false"
			aria-label="Search"
		/>
		<button class="btn btn--accent" type="submit">search</button>
		<button
			class="btn btn--pop"
			type="button"
			onclick={lucky}
			title="Play the top result instantly"
		>
			lucky ⚡
		</button>
	</form>

	{#if search.recents.length}
		<div class="recents">
			<span class="muted label">recent</span>
			{#each search.recents as item (item)}
				<button class="chip" onclick={() => pickRecent(item)}>{item}</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.panel {
		display: grid;
		gap: 10px;
	}
	.row {
		display: flex;
		gap: 10px;
	}
	.row .input {
		flex: 1;
		min-width: 0;
	}
	.recents {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	@media (max-width: 560px) {
		.row {
			flex-wrap: wrap;
		}
		.row .input {
			flex-basis: 100%;
		}
	}
</style>
