// Browser-level art probe: which URLs load in Chrome, and does referrer matter?
// node scripts/check-art-browser.mjs "lofi beats"
import puppeteer from 'puppeteer-core';

const query = process.argv[2] ?? 'lofi beats';
const browser = await puppeteer.launch({
	executablePath:
		process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	headless: true,
	args: ['--disable-gpu']
});
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

const report = await page.evaluate(async (q) => {
	const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
	const { tracks } = await res.json();

	const load = (url, referrerPolicy) =>
		new Promise((resolve) => {
			const img = new Image();
			if (referrerPolicy) img.referrerPolicy = referrerPolicy;
			img.onload = () => resolve(`ok ${img.naturalWidth}px`);
			img.onerror = () => resolve('FAIL');
			img.src = url;
		});

	const out = [];
	for (const t of tracks.slice(0, 12)) {
		const normal = await load(t.art);
		let retry = '-';
		if (normal === 'FAIL') retry = await load(t.art, 'no-referrer');
		out.push({ title: t.title, normal, retry, url: t.art });
	}
	return out;
}, query);

for (const row of report) {
	console.log(`${row.normal.padEnd(10)} referrer-retry:${row.retry.padEnd(10)} ${row.title}`);
	console.log(`    ${row.url}`);
}

await browser.close();
