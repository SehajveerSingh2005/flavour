<script lang="ts">
	import { goto } from '$app/navigation';
	import { player } from '$lib/player.svelte';
	import { search } from '$lib/search.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import { isYouTubeLink } from '$lib/youtube';
	import type { Collection, Track } from '$lib/types';
	import Icon from './Icon.svelte';

	let input = $state<HTMLInputElement | null>(null);
	let wrap = $state<HTMLDivElement | null>(null);
	let debounce: ReturnType<typeof setTimeout> | null = null;
	/** the panel is open while the field has focus */
	let open = $state(false);
	let active = $state(-1);
	let opening = $state<string | null>(null);

	const q = $derived(search.query.trim());
	const recentsOpen = $derived(open && !q && search.recents.length > 0);
	const link = $derived(q.length > 0 && isYouTubeLink(q));
	const collections = $derived([...search.albums.slice(0, 2), ...search.playlists.slice(0, 1)]);
	const resultsOpen = $derived(
		open &&
			q.length >= 2 &&
			(search.loading || search.results.length > 0 || search.albums.length > 0 || search.playlists.length > 0)
	);

	async function run(text: string): Promise<Track[]> {
		if (isYouTubeLink(text)) return search.runLink(text);
		return search.run(text);
	}

	/** A pasted link plays straight away. */
	async function playLink(text: string) {
		const tracks = await run(text);
		if (tracks.length) {
			player.playNow(tracks[0], tracks);
			if (tracks.length > 1) toasts.push(`Playlist loaded — ${tracks.length} tracks`, 'accent');
			close();
		} else if (!search.error) {
			toasts.push('Could not load that link', 'error');
		}
	}

	function onInput(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		search.setQuery(value);
		active = -1;
		if (debounce) clearTimeout(debounce);
		const text = value.trim();
		if (text.length < 3) return;
		debounce = setTimeout(() => {
			if (isYouTubeLink(text)) void playLink(text);
			else void run(text);
		}, 420);
	}

	function onKeydown(event: KeyboardEvent) {
		const items = search.recents;
		if (event.key === 'ArrowDown' && recentsOpen) {
			event.preventDefault();
			active = Math.min(active + 1, items.length - 1);
		} else if (event.key === 'ArrowUp' && recentsOpen) {
			event.preventDefault();
			active = Math.max(active - 1, -1);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (recentsOpen && active >= 0 && items[active]) {
				pickRecent(items[active]);
				return;
			}
			commit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			close();
			input?.blur();
		}
	}

	function commit() {
		if (debounce) clearTimeout(debounce);
		const text = q;
		if (text.length < 2) return;
		if (isYouTubeLink(text)) {
			void playLink(text);
			return;
		}
		close();
		input?.blur();
		void goto(`/search?q=${encodeURIComponent(text)}`);
	}

	function pickRecent(text: string) {
		search.setQuery(text);
		active = -1;
		void run(text);
		input?.focus();
	}

	function openCollection(item: Collection) {
		if (opening) return;
		opening = item.id;
		fetch(`/api/collection?type=${item.kind}&id=${encodeURIComponent(item.id)}`)
			.then(async (res) => {
				if (!res.ok) throw new Error('failed');
				const data = (await res.json()) as { tracks?: Track[] };
				const tracks = data.tracks ?? [];
				if (!tracks.length) throw new Error('empty');
				player.playNow(tracks[0], tracks);
				toasts.push(
					`${item.kind === 'album' ? 'Album' : 'Playlist'} · ${tracks.length} tracks queued`,
					'accent'
				);
				close();
			})
			.catch(() => toasts.push(`Could not load that ${item.kind}`, 'error'))
			.finally(() => (opening = null));
	}

	function close() {
		open = false;
		active = -1;
	}

	function onFocusOut(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (next && wrap?.contains(next)) return;
		close();
	}

	function clear() {
		search.setQuery('');
		search.clear();
		active = -1;
		input?.focus();
	}
</script>

<div class="searchwrap" bind:this={wrap} onfocusout={onFocusOut}>
	<div class="field" class:focus={open}>
		<span class="field-icon" aria-hidden="true"><Icon name="search" size={17} /></span>
		<input
			id="search-input"
			class="input"
			bind:this={input}
			value={search.query}
			oninput={onInput}
			onkeydown={onKeydown}
			onfocusin={() => {
				open = true;
				active = -1;
			}}
			placeholder="song, artist, or a vibe…"
			autocomplete="off"
			spellcheck="false"
			role="combobox"
			aria-label="Search YouTube Music, or paste a YouTube link"
			aria-expanded={open}
			aria-controls="search-panel"
			aria-autocomplete="list"
		/>
		{#if search.query}
			<button type="button" class="clear" title="Clear" aria-label="Clear search" onclick={clear}>
				<Icon name="x" size={14} />
			</button>
		{:else}
			<kbd class="slash">/</kbd>
		{/if}
	</div>

	{#if recentsOpen}
		<div class="panel card" id="search-panel" role="listbox" aria-label="Recent searches">
			<div class="panel-head">
				<span class="label mono">recent</span>
				<span class="grow"></span>
				<button class="mini-btn" onclick={() => search.clearRecents()} title="Forget them">
					<Icon name="x" size={12} /> clear
				</button>
			</div>
			<div class="panel-body">
				{#each search.recents as item, i (item)}
					<button
						class="panel-row"
						class:active={i === active}
						role="option"
						aria-selected={i === active}
						onmousedown={(event) => event.preventDefault()}
						onclick={() => pickRecent(item)}
					>
						<span class="row-icon"><Icon name="clock" size={13} /></span>
						<span class="truncate">{item}</span>
					</button>
				{/each}
			</div>
			<p class="panel-foot mono muted">↑↓ browse · ↵ search · esc close</p>
		</div>
	{:else if resultsOpen}
		<div class="panel card" id="search-panel">
			<div class="panel-head">
				<span class="label mono">tracks</span>
				<span class="grow"></span>
				{#if search.loading}
					<span class="spinner"></span>
				{:else if search.results.length}
					<span class="label mono">{search.results.length} hits</span>
				{/if}
			</div>

			<div class="panel-body">
				{#each search.results.slice(0, 5) as track (track.id)}
					<button
						class="track-row"
						onclick={() => {
							player.playNow(track, search.results);
							close();
						}}
						title="Play “{track.title}”"
					>
						{#if track.art}
							<img class="row-art squircle" src={track.art} alt="" loading="lazy" referrerpolicy="no-referrer" />
						{:else}
							<span class="row-art squircle fallback"><Icon name="music" size={14} /></span>
						{/if}
						<span class="row-meta">
							<strong class="truncate">{track.title}</strong>
							<em class="truncate">{track.artist}</em>
						</span>
					</button>
				{/each}

				{#if collections.length && !search.loading}
					<p class="panel-sep label">albums · playlists</p>
					<div class="cols">
						{#each collections as item (item.id)}
							<button class="col-tile" onclick={() => openCollection(item)} title="Load “{item.title}”">
								<span class="col-art squircle">
									{#if opening === item.id}
										<span class="spinner"></span>
									{:else if item.art}
										<img src={item.art} alt="" loading="lazy" referrerpolicy="no-referrer" />
									{:else}
										<Icon name={item.kind === 'album' ? 'disc' : 'list'} size={18} />
									{/if}
								</span>
								<strong class="truncate">{item.title}</strong>
							</button>
						{/each}
					</div>
				{/if}

				{#if search.error}
					<p class="panel-error"><Icon name="alert" size={13} /> {search.error}</p>
				{/if}
			</div>

			{#if !link}
				<button class="panel-cta" onclick={commit}>
					<Icon name="search" size={14} />
					see all {search.results.length} results
					<span class="grow"></span>
					<kbd>↵</kbd>
				</button>
			{:else}
				<button class="panel-cta" onclick={commit}>
					<Icon name="link" size={14} /> play this link
					<span class="grow"></span>
					<kbd>↵</kbd>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.searchwrap {
		position: relative;
		width: clamp(200px, 26vw, 380px);
		min-width: 0;
	}
	.field {
		position: relative;
		display: flex;
		align-items: center;
		height: 46px;
	}
	.field .input {
		padding-left: 42px;
		padding-right: 48px;
	}
	.field.focus .input {
		box-shadow: 6px 6px 0 var(--ink);
	}
	.field-icon {
		position: absolute;
		left: 15px;
		display: grid;
		place-items: center;
		color: var(--muted);
		pointer-events: none;
		z-index: 1;
	}
	.clear {
		position: absolute;
		right: 11px;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 2px solid var(--ink);
		border-radius: 9px;
		background: var(--surface-2);
		cursor: pointer;
		z-index: 1;
		transition: transform var(--t);
	}
	.clear:hover {
		transform: scale(1.08) rotate(6deg);
	}
	.slash {
		position: absolute;
		right: 13px;
		opacity: 0.75;
		pointer-events: none;
	}

	/* ---------- floating panel ---------- */
	.panel {
		position: absolute;
		top: calc(100% + 12px);
		left: -4px;
		right: -4px;
		z-index: 90;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 2px;
		max-height: min(480px, 66vh);
		overflow: hidden;
		padding: 9px 9px 7px;
		animation: panel-in 0.18s var(--ease-pop) both;
	}
	.panel-body {
		display: grid;
		gap: 2px;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	@keyframes panel-in {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.985);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.panel-head {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 3px 7px 8px;
		border-bottom: 2px dashed var(--faint);
	}
	.label {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.mini-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface);
		font-size: 0.66rem;
		font-weight: 700;
		color: var(--muted);
		cursor: pointer;
		transition:
			transform var(--t),
			color 0.15s ease;
	}
	.mini-btn:hover {
		transform: translate(-1px, -1px);
		color: var(--ink);
	}
	.panel-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 9px;
		padding: 7px 9px;
		border: 2px solid transparent;
		border-radius: 12px;
		text-align: left;
		font-size: 0.86rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 0.13s ease,
			border-color 0.13s ease,
			transform 0.14s var(--ease-pop);
	}
	.panel-row:hover,
	.panel-row.active {
		background: var(--accent-soft);
		border-color: var(--ink);
		transform: translateX(2px);
	}
	.row-icon {
		display: grid;
		place-items: center;
		color: var(--muted);
	}
	.track-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 9px;
		padding: 5px 7px;
		border: 2px solid transparent;
		border-radius: 12px;
		text-align: left;
		cursor: pointer;
		transition:
			background-color 0.13s ease,
			border-color 0.13s ease;
	}
	.track-row:hover {
		background: var(--accent-soft);
		border-color: var(--ink);
	}
	.row-art {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 2px solid var(--ink);
		border-radius: 10px;
		background: var(--surface-2);
		color: var(--muted);
		object-fit: cover;
	}
	.row-meta {
		display: grid;
		min-width: 0;
		line-height: 1.18;
	}
	.row-meta strong {
		font-size: 0.85rem;
	}
	.row-meta em {
		font-style: normal;
		font-size: 0.72rem;
		color: var(--muted);
	}
	.panel-sep {
		padding: 8px 7px 2px;
		border-top: 2px dashed var(--faint);
		margin-top: 4px;
	}
	.cols {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		padding: 6px 7px 8px;
	}
	.col-tile {
		display: grid;
		gap: 5px;
		cursor: pointer;
		text-align: left;
		min-width: 0;
	}
	.col-tile strong {
		font-size: 0.72rem;
	}
	.col-art {
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1;
		border: 2px solid var(--ink);
		border-radius: 13px;
		overflow: hidden;
		background: var(--surface-2);
		color: var(--muted);
		box-shadow: 2px 2px 0 var(--ink);
		transition: transform var(--t);
	}
	.col-tile:hover .col-art {
		transform: translate(-1px, -1px);
	}
	.col-art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.col-art .spinner {
		width: 14px;
		height: 14px;
		border-width: 2px;
	}
	.panel-error {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 8px;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--muted);
	}
	.panel-cta {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-top: 5px;
		padding: 9px 11px;
		border: 2px solid var(--ink);
		border-radius: 13px;
		background: var(--accent);
		color: var(--accent-ink);
		font-size: 0.84rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 2px 2px 0 var(--ink);
		transition:
			transform var(--t),
			box-shadow var(--t);
	}
	.panel-cta:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 var(--ink);
	}
	.panel-cta kbd {
		border-color: var(--accent-ink);
		background: transparent;
		color: inherit;
		box-shadow: none;
	}
	.panel-foot {
		padding: 6px 8px 2px;
		font-size: 0.64rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	@media (max-width: 960px) {
		.searchwrap {
			flex: 1;
			width: auto;
		}
	}
	@media (max-width: 640px) {
		.slash {
			display: none;
		}
		.panel {
			position: fixed;
			top: 122px;
			left: 10px;
			right: 10px;
		}
	}
</style>
