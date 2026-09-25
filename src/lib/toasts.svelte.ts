export type ToastTone = 'info' | 'accent' | 'error';

export interface Toast {
	id: number;
	text: string;
	tone: ToastTone;
}

let counter = 0;
let items = $state<Toast[]>([]);

export const toasts = {
	get items() {
		return items;
	},
	push(text: string, tone: ToastTone = 'info', ms = 3200) {
		const id = ++counter;
		items = [...items, { id, text, tone }];
		setTimeout(() => {
			items = items.filter((t) => t.id !== id);
		}, ms);
	},
	dismiss(id: number) {
		items = items.filter((t) => t.id !== id);
	}
};
