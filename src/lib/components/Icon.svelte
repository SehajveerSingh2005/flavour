<script module lang="ts">
	/**
	 * One stroked 24×24 icon set, drawn in-house so the player never falls
	 * back to emoji. Stroke width is set on the <svg> and inherited.
	 */
	export const ICONS = {
		play: '<path d="M8 5.4 19 12 8 18.6Z" fill="currentColor" stroke-linejoin="round"/>',
		pause:
			'<rect x="7" y="5" width="3.6" height="14" rx="1.3" fill="currentColor"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.3" fill="currentColor"/>',
		'skip-back':
			'<path d="M18.6 5.6v12.8L9.4 12Z" fill="currentColor" stroke-linejoin="round"/><path d="M5.6 5v14"/>',
		'skip-forward':
			'<path d="M5.4 5.6v12.8L14.6 12Z" fill="currentColor" stroke-linejoin="round"/><path d="M18.4 5v14"/>',
		shuffle:
			'<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/>',
		repeat:
			'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
		'repeat-one':
			'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11.5 10.5h1v3.5"/>',
		'volume-high':
			'<path d="M11 5 6 9H2v6h4l5 4z" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 4.9a10 10 0 0 1 0 14.2"/>',
		'volume-low':
			'<path d="M11 5 6 9H2v6h4l5 4z" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
		'volume-x':
			'<path d="M11 5 6 9H2v6h4l5 4z" stroke-linejoin="round"/><path d="m21.5 9-5 5"/><path d="m16.5 9 5 5"/>',
		search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>',
		sparkles:
			'<path d="m12 3 1.7 5.1a2 2 0 0 0 1.2 1.2L20 11l-5.1 1.7a2 2 0 0 0-1.2 1.2L12 19l-1.7-5.1a2 2 0 0 0-1.2-1.2L4 11l5.1-1.7a2 2 0 0 0 1.2-1.2Z" stroke-linejoin="round"/><path d="M5 3v3"/><path d="M3.5 4.5h3"/><path d="M19 18v3"/><path d="M17.5 19.5h3"/>',
		plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
		'play-next': '<path d="m15 10 5 5-5 5"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>',
		x: '<path d="M6 6 18 18"/><path d="M18 6 6 18"/>',
		grip: '<circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/>',
		'chevron-down': '<path d="m6 9 6 6 6-6"/>',
		'chevron-up': '<path d="m6 15 6-6 6 6"/>',
		'chevron-right': '<path d="m9 6 6 6-6 6"/>',
		maximize:
			'<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/>',
		minimize:
			'<path d="M3 8h3a2 2 0 0 0 2-2V3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/>',
		list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><circle cx="3.6" cy="6" r="1.2" fill="currentColor"/><circle cx="3.6" cy="12" r="1.2" fill="currentColor"/><circle cx="3.6" cy="18" r="1.2" fill="currentColor"/>',
		disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/>',
		more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
		trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m6 7 1 13h10l1-13"/>',
		radio: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/><circle cx="12" cy="12" r="2"/>',
		check: '<path d="m4 12.5 5.2 5L20 6.5"/>',
		pencil: '<path d="M4 20h4.2L18.4 9.8a2.9 2.9 0 0 0-4.2-4.2L4 15.8Z"/><path d="m13.4 6.4 4.2 4.2"/>',
		alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.4h.01"/>',
		help: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.3a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.3 1-1.3 1.9v.2"/><path d="M12 17.4h.01"/>',
		music:
			'<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
		'arrow-up': '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
		'arrow-down': '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
		link: '<path d="M9.5 14.5 14.5 9.5"/><path d="m11 6.5 1-1a4.2 4.2 0 0 1 6 6l-1 1"/><path d="m13 17.5-1 1a4.2 4.2 0 0 1-6-6l1-1"/>',
		clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
		heart:
			'<path d="M12 19.7 5.3 13a4.3 4.3 0 0 1 6.1-6.1l.6.6.6-.6a4.3 4.3 0 0 1 6.1 6.1Z" stroke-linejoin="round"/>',
		'heart-filled':
			'<path d="M12 19.7 5.3 13a4.3 4.3 0 0 1 6.1-6.1l.6.6.6-.6a4.3 4.3 0 0 1 6.1 6.1Z" fill="currentColor" stroke-linejoin="round"/>',
		quote:
			'<path d="M5 5h14a1.6 1.6 0 0 1 1.6 1.6v6.8A1.6 1.6 0 0 1 19 15h-6.4L7.6 19v-4H5a1.6 1.6 0 0 1-1.6-1.6V6.6A1.6 1.6 0 0 1 5 5Z" stroke-linejoin="round"/><path d="M8 9h8"/><path d="M8 12h5"/>',
		download: '<path d="M12 4v11"/><path d="m7.8 10.8 4.2 4.2 4.2-4.2"/><path d="M5 20h14"/>',
		upload: '<path d="M12 20V9"/><path d="m7.8 13.2 4.2-4.2 4.2 4.2"/><path d="M5 4h14"/>'
	} as const;

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		/** px, square */
		size?: number;
		/** stroke width on the 24px grid */
		stroke?: number;
		/** accessible label — icons are decorative without one */
		label?: string;
		class?: string;
	}

	let { name, size = 20, stroke = 2.2, label, class: className = '' }: Props = $props();
</script>

<svg
	class="icon {className}"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-hidden={label ? undefined : 'true'}
>
	{#if label}<title>{label}</title>{/if}
	{@html ICONS[name]}
</svg>

<style>
	.icon {
		display: block;
		flex: none;
	}
</style>
