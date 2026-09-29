<script lang="ts">
	import { flip } from 'svelte/animate';
	import { formatDuration, formatRuntime } from '$lib/format';
	import { likes } from '$lib/likes.svelte';
	import { mixes } from '$lib/mixes.svelte';
	import { player } from '$lib/player.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import type { Track } from '$lib/types';
	import { ui } from '$lib/ui.svelte';
	import Icon from './Icon.svelte';

	interface MenuState {
		uid: string;
		index: number;
		x: number;
		y: number;
	}

	interface HeadMenuState {
		x: number;
		y: number;
	}

	let menu = $state<MenuState | null>(null);
	let headMenu = $state<HeadMenuState | null>(null);
	let dragFrom = $state<number | null>(null);
	let dragOver = $state<number | null>(null);
	let saving = $state(false);
	let mixName = $state('');

	const totalTime = $derived(player.queue.reduce((sum, item) => sum + (item.duration || 0), 0));
	const upcoming = $derived(Math.max(player.queue.length - (player.index + 1), 0));
	const now = $derived(player.queue[player.index] ?? player.queue[0] ?? null);
	const next = $derived(player.queue[player.index + 1] ?? null);

	function closeMenus() {
		menu = null;
		headMenu = null;
	}

	function onDocClick(event: MouseEvent) {
		if (!menu && !headMenu) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('[data-menu-trigger], .row-menu')) return;
		closeMenus();
	}

	function place(button: HTMLElement, width: number, height: number) {
		const rect = button.getBoundingClientRect();
		const x = Math.max(8, Math.min(rect.right - width, innerWidth - width - 8));
		const up = rect.bottom + height + 10 > innerHeight;
		const y = up ? Math.max(8, rect.top - height - 8) : rect.bottom + 8;
		return { x, y };
	}

	function openMenu(event: MouseEvent, uid: string, index: number) {
		const { x, y } = place(event.currentTarget as HTMLElement, 196, 250);
		headMenu = null;
		menu = { uid, index, x, y };
	}

	function openHeadMenu(event: MouseEvent) {
		const { x, y } = place(event.currentTarget as HTMLElement, 214, 120);
		menu = null;
		headMenu = { x, y };
	}

	function act(fn: () => void) {
		fn();
		closeMenus();
	}

	/* ---------- drag to reorder ---------- */
	function dragStart(event: DragEvent, i: number) {
		dragFrom = i;
		event.dataTransfer?.setData('text/plain', String(i));
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	function dragOverRow(event: DragEvent, i: number) {
		if (dragFrom === null) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		if (i !== dragFrom) dragOver = i;
	}

	function dropRow(event: DragEvent, i: number) {
		event.preventDefault();
		if (dragFrom !== null && dragFrom !== i) player.move(dragFrom, i);
		dragFrom = null;
		dragOver = null;
	}

	function dragEnd() {
		dragFrom = null;
		dragOver = null;
	}

	/* ---------- keyboard reorder ---------- */
	function nudge(event: KeyboardEvent, i: number) {
		if (event.key === 'ArrowUp' && i > 0) {
			event.preventDefault();
			player.move(i, i - 1);
		}
		if (event.key === 'ArrowDown' && i < player.queue.length - 1) {
			event.preventDefault();
			player.move(i, i + 1);
		}
	}

	async function topUp() {
		const ok = await player.refillQueue();
		if (!ok && !player.refilling) toasts.push('The radio had nothing new', 'error');
	}

	/* ---------- save the queue as a mix ---------- */
	function startSaving() {
		if (!player.queue.length) return;
		mixName = '';
		saving = true;
		if (!ui.queueOpen) ui.toggleQueue();
	}

	function saveMix(event: SubmitEvent) {
		event.preventDefault();
		if (!player.queue.length) return;
		const tracks: Track[] = player.queue.map((item) => ({
			id: item.id,
			title: item.title,
			artist: item.artist,
			duration: item.duration,
			art: item.art,
			source: item.source
		}));
		const mix = mixes.create(mixName.trim() || 'queue', tracks);
		saving = false;
		mixName = '';
		toasts.push(`saved ${tracks.length} tracks to “${mix.name}”`, 'accent');
	}

	function toggleLike(track: Track | undefined) {
		if (!track) return;
		const liked = likes.toggle(track);
		toasts.push(
			liked ? `liked “${track.title}”` : `took “${track.title}” out of likes`,
			liked ? 'accent' : 'info'
		);
	}
</script>

<svelte:window
	onclick={onDocClick}
	onkeydown={(event) => {
		if (event.key === 'Escape') closeMenus();
	}}
/>

<section class="card queue-card" class:open={ui.queueOpen}>
	<header class="card-head">
		<button class="toggle" aria-expanded={ui.queueOpen} onclick={() => ui.toggleQueue()}>
			<Icon name={ui.queueOpen ? 'chevron-up' : 'chevron-down'} size={16} />
			<h2 class="display">queue</h2>
			{#if player.queue.length}
				<span class="qmeta mono truncate">{player.queue.length} · {formatRuntime(totalTime)}</span>
			{/if}
		</button>
		<span class="grow"></span>
		<button
			class="btn btn--icon tiny"
			class:btn--on={player.radio}
			title={player.radio ? 'Autoplay radio is on' : 'Autoplay radio is off'}
			aria-pressed={player.radio}
			onclick={() => player.toggleRadio()}
		>
			<Icon name="radio" size={15} />
		</button>
		{#if player.queue.length || player.radio}
			<button
				class="btn btn--icon tiny"
				data-menu-trigger
				title="Queue actions"
				aria-haspopup="menu"
				aria-expanded={!!headMenu}
				onclick={(event) => (headMenu ? closeMenus() : openHeadMenu(event))}
			>
				<Icon name="more" size={15} />
			</button>
		{/if}
	</header>

	{#if ui.queueOpen}
		<div class="queue-body">
			{#if saving}
				<form class="save-mix" onsubmit={saveMix}>
					<input
						class="input"
						placeholder="name this mix"
						bind:value={mixName}
						aria-label="Mix name"
						autocomplete="off"
					/>
					<button class="btn btn--accent" type="submit">save</button>
					<button class="btn btn--ghost" type="button" onclick={() => (saving = false)}>cancel</button>
				</form>
			{/if}
			{#if !player.queue.length}
				<div class="placeholder">
					<div class="placeholder-art squircle" aria-hidden="true"><Icon name="list" size={22} /></div>
					<p class="display">the queue is empty</p>
					<p class="muted">
						hit <Icon name="plus" size={12} /> on a result, or <Icon name="play-next" size={12} /> to play
						it next.
					</p>
					{#if player.radio}
						<p class="hint mono">autoplay radio is on — the music never has to stop</p>
					{/if}
				</div>
			{:else}
				<ul class="list">
					{#each player.queue as item, i (item.uid)}
						{@const active = i === player.index}
						<li
							class="row"
							class:active
							class:dragging={dragFrom === i}
							class:drop={dragOver === i}
							animate:flip={{ duration: 180 }}
							draggable="true"
							ondragstart={(event) => dragStart(event, i)}
							ondragover={(event) => dragOverRow(event, i)}
							ondrop={(event) => dropRow(event, i)}
							ondragend={dragEnd}
						>
							<span class="grip" title="Drag to reorder" aria-hidden="true">
								<Icon name="grip" size={14} />
							</span>
							<button
								class="hit squircle"
								onclick={() => player.playAt(i)}
								title={active ? 'Playing now' : 'Play this'}
								onkeydown={(event) => nudge(event, i)}
							>
								<span class="idx">
									{#if active}
										<span class="eq" class:paused={!player.isPlaying}><i></i><i></i><i></i><i></i></span
										>
									{:else}
										{i + 1}
									{/if}
								</span>
								<img
									class="thumb squircle"
									src={item.art}
									alt=""
									loading="lazy"
									referrerpolicy="no-referrer"
								/>
								<span class="meta">
									<strong class="truncate">{item.title}</strong>
									<em class="truncate">{item.artist}</em>
								</span>
								<span class="dur mono">{formatDuration(item.duration)}</span>
							</button>
							<button
								class="btn btn--icon more"
								data-menu-trigger
								title="More actions"
								aria-haspopup="menu"
								aria-expanded={menu?.uid === item.uid}
								onclick={(event) => (menu?.uid === item.uid ? closeMenus() : openMenu(event, item.uid, i))}
							>
								<Icon name="more" size={16} />
							</button>
						</li>
					{/each}
				</ul>

				{#if player.refilling}
					<div class="radio-row"><span class="spinner"></span> tuning the radio…</div>
				{/if}
			{/if}
		</div>
	{:else}
		<!-- closed: a taste of what is playing and what is next -->
		<div class="preview">
			{#if !player.queue.length}
				<div class="mini-empty">
					<span class="mini-empty-icon"><Icon name="list" size={16} /></span>
					<p>
						nothing queued — hit <Icon name="plus" size={11} /> on any track
					</p>
					{#if player.radio}
						<p class="hint mono">radio is on — the music keeps playing</p>
					{/if}
				</div>
			{:else}
				{#if now}
					<button class="p-row now" onclick={() => ui.toggleQueue()} title="Open the queue">
						<span class="p-idx">
							<span class="eq" class:paused={!player.isPlaying}><i></i><i></i><i></i><i></i></span>
						</span>
						{#if now.art}<img class="p-art squircle" src={now.art} alt="" referrerpolicy="no-referrer" />
						{:else}<span class="p-art squircle fallback"><Icon name="music" size={14} /></span>{/if}
						<span class="p-meta">
							<strong class="truncate">{now.title}</strong>
							<em class="truncate">{now.artist}</em>
						</span>
						<span class="p-dur mono">{formatDuration(now.duration)}</span>
					</button>
				{/if}
				{#if next}
					<button
						class="p-row"
						onclick={() => player.playAt(player.index + 1)}
						title="Play “{next.title}”"
					>
						<span class="p-idx mono">{player.index + 2}</span>
						{#if next.art}<img class="p-art squircle" src={next.art} alt="" referrerpolicy="no-referrer" />
						{:else}<span class="p-art squircle fallback"><Icon name="music" size={14} /></span>{/if}
						<span class="p-meta">
							<strong class="truncate">{next.title}</strong>
							<em class="truncate">{next.artist}</em>
						</span>
						<span class="p-dur mono">{formatDuration(next.duration)}</span>
					</button>
				{/if}
				{#if upcoming > 1}
					<button class="show-all" onclick={() => ui.toggleQueue()}>
						show all {upcoming} up next <Icon name="chevron-down" size={14} />
					</button>
				{/if}
			{/if}
		</div>
	{/if}
</section>

{#if headMenu}
	<div class="row-menu card" role="menu" style="left:{headMenu.x}px; top:{headMenu.y}px">
		<button
			class="menu-item"
			role="menuitem"
			disabled={!player.queue.length}
			onclick={() => act(startSaving)}
		>
			<Icon name="disc" size={15} /> save as a mix
		</button>
		<button
			class="menu-item"
			role="menuitem"
			disabled={!player.radio || !player.current || player.refilling}
			onclick={() => act(() => void topUp())}
		>
			{#if player.refilling}<span class="spinner"></span>{:else}<Icon name="radio" size={15} />{/if}
			top up from the radio
		</button>
		<button
			class="menu-item danger"
			role="menuitem"
			disabled={!player.queue.length}
			onclick={() => act(() => player.clearQueue())}
		>
			<Icon name="trash" size={15} /> clear queue
		</button>
	</div>
{/if}

{#if menu}
	{@const rowTrack = player.queue[menu.index]}
	<div class="row-menu card" role="menu" style="left:{menu.x}px; top:{menu.y}px">
		<button class="menu-item" role="menuitem" onclick={() => act(() => player.playAt(menu!.index))}>
			<Icon name="play" size={15} /> play now
		</button>
		<button
			class="menu-item"
			role="menuitem"
			disabled={menu.index === player.index}
			onclick={() => act(() => player.moveToNext(menu!.index))}
		>
			<Icon name="play-next" size={15} /> play next
		</button>
		<button class="menu-item" role="menuitem" onclick={() => act(() => toggleLike(rowTrack))}>
			<Icon name={rowTrack && likes.has(rowTrack.id) ? 'heart-filled' : 'heart'} size={15} />
			{rowTrack && likes.has(rowTrack.id) ? 'unlike' : 'like'}
		</button>
		<button
			class="menu-item"
			role="menuitem"
			disabled={menu.index === 0}
			onclick={() => act(() => player.move(menu!.index, menu!.index - 1))}
		>
			<Icon name="arrow-up" size={15} /> move up
		</button>
		<button
			class="menu-item"
			role="menuitem"
			disabled={menu.index === player.queue.length - 1}
			onclick={() => act(() => player.move(menu!.index, menu!.index + 1))}
		>
			<Icon name="arrow-down" size={15} /> move down
		</button>
		<button
			class="menu-item"
			role="menuitem"
			disabled={menu.index === 0 || menu.index === player.index}
			onclick={() => act(() => player.moveToTop(menu!.index))}
		>
			<Icon name="chevron-up" size={15} /> move to top
		</button>
		<button class="menu-item danger" role="menuitem" onclick={() => act(() => player.removeAt(menu!.index))}>
			<Icon name="trash" size={15} /> remove
		</button>
	</div>
{/if}

<style>
	.queue-card {
		display: grid;
		grid-template-rows: auto auto;
		min-height: 0;
		overflow: hidden;
		min-width: 0;
	}
	.queue-card.open {
		grid-template-rows: auto minmax(0, 1fr);
	}
	.card-head {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 9px 11px 8px;
		border-bottom: 2px dashed var(--faint);
		background: color-mix(in srgb, var(--surface-2) 55%, var(--surface));
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		padding: 3px 6px;
		border: 2px solid transparent;
		border-radius: 11px;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}
	.toggle:hover {
		background: var(--surface-2);
		border-color: var(--ink);
	}
	.card-head h2 {
		font-size: 1.05rem;
	}
	.qmeta {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--muted);
		max-width: 120px;
	}
	.tiny {
		width: 32px;
		height: 32px;
		font-size: 0.9rem;
		border-radius: 11px;
	}

	/* ---------- closed: up-next preview ---------- */
	.preview {
		display: grid;
		gap: 2px;
		padding: 6px 10px 10px;
	}
	.p-row {
		display: grid;
		grid-template-columns: 22px 34px minmax(0, 1fr) auto;
		align-items: center;
		gap: 9px;
		padding: 6px 5px;
		border-radius: 11px;
		border-bottom: 2px dashed var(--faint);
		text-align: left;
		cursor: pointer;
		min-width: 0;
		transition: background-color 0.15s ease;
	}
	.p-row:last-of-type {
		border-bottom: 0;
	}
	.p-row:hover {
		background: var(--surface-2);
	}
	.p-row.now {
		background: var(--accent-soft);
		border-bottom: 0;
	}
	.p-idx {
		display: grid;
		place-items: center;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.p-row.now .p-idx {
		color: var(--accent);
	}
	.p-art {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		object-fit: cover;
		border: 2px solid var(--ink);
		border-radius: 10px;
		background: var(--surface-2);
		color: var(--muted);
	}
	.p-art.fallback {
		background: var(--surface-2);
	}
	.p-meta {
		display: grid;
		min-width: 0;
		line-height: 1.18;
	}
	.p-meta strong {
		font-size: 0.84rem;
	}
	.p-meta em {
		font-style: normal;
		font-size: 0.72rem;
		color: var(--muted);
	}
	.p-dur {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--muted);
	}
	.show-all {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin: 6px 4px 2px;
		padding: 8px 10px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
		background: var(--surface);
		box-shadow: 2px 2px 0 var(--ink);
		font-weight: 700;
		font-size: 0.76rem;
		cursor: pointer;
		transition:
			transform var(--t),
			box-shadow var(--t);
	}
	.show-all:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 var(--ink);
	}
	.mini-empty {
		display: grid;
		justify-items: center;
		gap: 6px;
		padding: 12px 10px 14px;
		text-align: center;
	}
	.mini-empty-icon {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border: 2px solid var(--ink);
		border-radius: 13px;
		background: var(--surface-2);
		color: var(--muted);
	}
	.mini-empty p {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		flex-wrap: wrap;
		margin: 0;
		font-size: 0.78rem;
		color: var(--muted);
	}

	/* ---------- open: the full list ---------- */
	.queue-body {
		min-height: 0;
		overflow-y: auto;
		padding: 6px 10px 12px;
	}
	/* ---------- save the queue as a mix ---------- */
	.save-mix {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 6px 2px 10px;
		padding: 10px;
		border: 2px dashed var(--ink);
		border-radius: 14px;
		background: color-mix(in srgb, var(--surface-2) 60%, transparent);
	}
	.save-mix .input {
		flex: 1 1 140px;
		min-width: 0;
		padding: 0.5rem 0.7rem;
		font-size: 0.85rem;
	}
	.save-mix .btn {
		padding: 0.45rem 0.7rem;
		font-size: 0.8rem;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
	}
	.row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 3px;
		border-bottom: 2px dashed var(--faint);
		padding: 2px 0;
		transition: background-color 0.2s ease;
	}
	.row:last-child {
		border-bottom: 0;
	}
	.row.active {
		background: var(--accent-soft);
	}
	.row.dragging {
		opacity: 0.45;
	}
	.row.drop {
		outline: 3px dashed var(--accent);
		outline-offset: -3px;
		border-radius: 14px;
	}
	.grip {
		display: grid;
		place-items: center;
		width: 18px;
		color: var(--muted);
		cursor: grab;
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.row:hover .grip,
	.row:focus-within .grip {
		opacity: 1;
	}
	.row:active .grip {
		cursor: grabbing;
	}
	.hit {
		display: grid;
		grid-template-columns: 24px 42px minmax(0, 1fr) auto;
		align-items: center;
		gap: 8px;
		padding: 6px 6px;
		border-radius: 13px;
		cursor: pointer;
		text-align: left;
		min-width: 0;
		transition: transform 0.14s var(--ease-pop);
	}
	.hit:hover {
		transform: translateX(3px);
	}
	.idx {
		display: grid;
		place-items: center;
		font-weight: 700;
		font-size: 0.78rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.row.active .idx {
		color: var(--accent);
	}
	.thumb {
		width: 42px;
		height: 42px;
		object-fit: cover;
		border: 2px solid var(--ink);
		border-radius: 11px;
		background: var(--surface-2);
	}
	.meta {
		display: grid;
		min-width: 0;
		line-height: 1.18;
	}
	.meta strong {
		font-size: 0.88rem;
	}
	.meta em {
		font-style: normal;
		font-size: 0.74rem;
		color: var(--muted);
	}
	.dur {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--muted);
	}
	.more {
		width: 30px;
		height: 30px;
		font-size: 0.85rem;
		border-radius: 11px;
	}
	.row-menu {
		position: fixed;
		z-index: 120;
		width: 214px;
		padding: 7px;
		display: grid;
		gap: 3px;
		box-shadow: var(--shadow);
	}
	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.42rem 0.6rem;
		border: 2px solid transparent;
		border-radius: 11px;
		font-size: 0.86rem;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		transition:
			background-color 0.12s ease,
			border-color 0.12s ease;
	}
	.menu-item:hover:not(:disabled) {
		background: var(--surface-2);
		border-color: var(--ink);
	}
	.menu-item:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.menu-item.danger:hover:not(:disabled) {
		background: var(--pop);
		color: var(--pop-ink, var(--ink));
	}
	.menu-item .spinner {
		width: 14px;
		height: 14px;
		border-width: 2px;
	}
	.radio-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		margin-top: 10px;
		padding: 8px;
		border: 2px dashed var(--faint);
		border-radius: 13px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--muted);
	}
	.placeholder {
		padding: 26px 12px;
		display: grid;
		gap: 8px;
		justify-items: center;
		text-align: center;
	}
	.placeholder-art {
		display: grid;
		place-items: center;
		width: 50px;
		height: 50px;
		margin-bottom: 4px;
		border: 2px solid var(--ink);
		border-radius: 17px;
		background: var(--surface-2);
		color: var(--muted);
		box-shadow: var(--shadow-sm);
	}
	.placeholder .display {
		font-size: 1.2rem;
	}
	.placeholder p.muted {
		max-width: 36ch;
		display: flex;
		align-items: center;
		gap: 4px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.hint {
		font-size: 0.68rem;
		color: var(--muted);
		margin: 0;
	}
	@media (max-width: 640px) {
		.hit {
			grid-template-columns: 22px 40px minmax(0, 1fr);
		}
		.dur {
			display: none;
		}
	}
	@media (hover: none) {
		.grip {
			display: none;
		}
		.row {
			grid-template-columns: minmax(0, 1fr) auto;
		}
	}
</style>
