<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		art?: string;
		title: string;
		subtitle?: string;
		kind?: 'track' | 'album' | 'playlist';
		loading?: boolean;
		disabled?: boolean;
		onclick?: () => void;
	}

	let {
		art = '',
		title,
		subtitle = '',
		kind = 'track',
		loading = false,
		disabled = false,
		onclick
	}: Props = $props();

	const fallback: Record<NonNullable<Props['kind']>, 'music' | 'disc' | 'list'> = {
		track: 'music',
		album: 'disc',
		playlist: 'list'
	};
</script>

<button class="tile" {disabled} {onclick} title="Play “{title}”">
	<span class="tile-art squircle">
		{#if art}
			<img src={art} alt="" loading="lazy" referrerpolicy="no-referrer" />
		{:else}
			<Icon name={fallback[kind]} size={24} />
		{/if}
		<span class="tile-badge squircle">
			{#if loading}<span class="spinner"></span>{:else}<Icon name="play" size={15} />{/if}
		</span>
	</span>
	<span class="tile-meta">
		<strong class="truncate">{title}</strong>
		{#if subtitle}<em class="truncate">{subtitle}</em>{/if}
	</span>
</button>

<style>
	.tile {
		display: grid;
		gap: 7px;
		width: 100%;
		text-align: left;
		cursor: pointer;
	}
	.tile:disabled {
		cursor: progress;
	}
	.tile-art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1;
		border: 2px solid var(--ink);
		border-radius: 18px;
		background: var(--surface-2);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
		color: var(--muted);
		transition:
			transform var(--t),
			box-shadow var(--t);
	}
	.tile-art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.tile:not(:disabled):hover .tile-art {
		transform: translate(-2px, -3px) rotate(-1deg);
		box-shadow: 6px 6px 0 var(--ink);
	}
	.tile-badge {
		position: absolute;
		right: 7px;
		bottom: 7px;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border: 2px solid var(--ink);
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow: 2px 2px 0 var(--ink);
		opacity: 0;
		transform: translateY(5px);
		transition:
			opacity 0.16s ease,
			transform 0.24s var(--ease-pop);
	}
	.tile-badge .spinner {
		width: 13px;
		height: 13px;
		border-width: 2px;
	}
	.tile:not(:disabled):hover .tile-badge,
	.tile:focus-visible .tile-badge,
	.tile:disabled .tile-badge {
		opacity: 1;
		transform: none;
	}
	@media (hover: none) {
		.tile-badge {
			opacity: 1;
			transform: none;
		}
	}
	.tile-meta {
		display: grid;
		line-height: 1.15;
		min-width: 0;
	}
	.tile-meta strong {
		font-size: 0.84rem;
	}
	.tile-meta em {
		font-style: normal;
		font-size: 0.73rem;
		color: var(--muted);
	}
</style>
