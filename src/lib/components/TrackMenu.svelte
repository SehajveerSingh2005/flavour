<script lang="ts">
	import { likes } from '$lib/likes.svelte';
	import { mixes } from '$lib/mixes.svelte';
	import { player } from '$lib/player.svelte';
	import { toasts } from '$lib/toasts.svelte';
	import type { Track } from '$lib/types';
	import Icon from './Icon.svelte';

	interface Props {
		track: Track;
		/** icon button size — rows use the small one */
		size?: number;
	}

	let { track, size = 16 }: Props = $props();

	let open = $state(false);
	let pos = $state({ x: 0, y: 0 });

	function onDocClick(event: MouseEvent) {
		if (!open) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('[data-menu-trigger], .track-menu')) return;
		open = false;
	}

	function toggle(event: MouseEvent) {
		if (open) {
			open = false;
			return;
		}
		const button = event.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();
		const WIDTH = 226;
		const HEIGHT = 300;
		const x = Math.max(8, Math.min(rect.right - WIDTH, innerWidth - WIDTH - 8));
		const up = rect.bottom + HEIGHT + 10 > innerHeight;
		const y = up ? Math.max(8, rect.top - HEIGHT - 8) : rect.bottom + 8;
		pos = { x, y };
		open = true;
	}

	function act(fn: () => void) {
		fn();
		open = false;
	}

	function addTo(mixId: string, name: string) {
		mixes.addTrack(mixId, track);
		toasts.push(`added to “${name}”`, 'accent');
	}

	function newMix() {
		const mix = mixes.create('new mix', [track]);
		toasts.push(`started “${mix.name}” — rename it any time`, 'accent');
	}

	function toggleLike() {
		const liked = likes.toggleTrack(track);
		toasts.push(liked ? `liked “${track.title}”` : `took “${track.title}” out of likes`, liked ? 'accent' : 'info');
	}
</script>

<svelte:window onclick={onDocClick} onkeydown={(event) => event.key === 'Escape' && (open = false)} />

<button
	class="btn btn--icon menu-btn"
	data-menu-trigger
	title="Add or queue"
	aria-haspopup="menu"
	aria-expanded={open}
	onclick={toggle}
>
	<Icon name="plus" size={size} />
</button>

{#if open}
	<div class="track-menu card" role="menu" style="left:{pos.x}px; top:{pos.y}px">
		<button class="menu-item" role="menuitem" onclick={() => act(() => player.addNext(track))}>
			<Icon name="play-next" size={15} /> play next
		</button>
		<button class="menu-item" role="menuitem" onclick={() => act(() => player.addToQueue(track))}>
			<Icon name="plus" size={15} /> add to queue
		</button>
		<button class="menu-item" role="menuitem" onclick={() => act(toggleLike)}>
			<Icon name={likes.hasTrack(track.id) ? 'heart-filled' : 'heart'} size={15} />
			{likes.hasTrack(track.id) ? 'unlike' : 'like'}
		</button>
		<p class="menu-sep label">add to mix</p>
		{#each mixes.items as mix (mix.id)}
			<button
				class="menu-item"
				role="menuitem"
				onclick={() => act(() => addTo(mix.id, mix.name))}
			>
				<Icon name="disc" size={15} /> <span class="truncate">{mix.name}</span>
			</button>
		{/each}
		<button class="menu-item" role="menuitem" onclick={() => act(newMix)}>
			<Icon name="plus" size={15} /> new mix…
		</button>
	</div>
{/if}

<style>
	.menu-btn {
		width: 34px;
		height: 34px;
		border-radius: 12px;
		font-size: 0.9rem;
	}
	.track-menu {
		position: fixed;
		z-index: 130;
		width: 226px;
		max-height: 320px;
		overflow-y: auto;
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
	.menu-item:hover {
		background: var(--surface-2);
		border-color: var(--ink);
	}
	.menu-sep {
		padding: 7px 8px 3px;
		border-top: 2px dashed var(--faint);
		margin-top: 3px;
	}
	.label {
		font-size: 0.66rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
</style>
