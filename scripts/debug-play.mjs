// Focused playback diagnosis: node scripts/debug-play.mjs "lofi beats"
import puppeteer from 'puppeteer-core';

const query = process.argv[2] ?? 'lofi beats';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
	executablePath:
		process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	headless: true,
	args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--mute-audio']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

page.on('console', (m) => console.log(`[console:${m.type()}]`, m.text().slice(0, 160)));
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 200)));
page.on('requestfailed', (r) => {
	const u = r.url();
	if (u.includes('youtube') || u.includes('ytimg') || u.includes('googleusercontent')) {
		console.log('[reqfail]', r.failure()?.errorText, u.slice(0, 120));
	}
});

await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.removeItem('flavour:queue'));
await page.reload({ waitUntil: 'domcontentloaded' });
await sleep(1000);
await page.click('#search-input');
await page.type('#search-input', query, { delay: 20 });
await sleep(2600);
await page.click('form .btn--pop');

const snap = () =>
	page.evaluate(() => {
		const txt = (sel) => document.querySelector(sel)?.textContent?.trim() ?? null;
		const img = document.querySelector('img.art');
		const iframe = document.querySelector('#yt-host');
		return {
			pos: txt('.np .times span'),
			dur: txt('.np .times span:last-child'),
			glyph: txt('.np .play'),
			title: txt('.np .title'),
			artLoaded: !!img && img.naturalWidth > 0,
			artSrc: img?.src?.slice(0, 100) ?? null,
			ytSrc: iframe?.getAttribute?.('src')?.slice(0, 60) ?? (iframe ? iframe.tagName : null)
		};
	});

for (let i = 0; i < 10; i++) {
	await sleep(1500);
	console.log(i, JSON.stringify(await snap()));
}
await browser.close();
