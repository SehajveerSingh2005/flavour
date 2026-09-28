// Mobile-layout smoke test + screenshots. Same prerequisites as shoot.mjs.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHROME = [
	process.env.CHROME_PATH,
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'/usr/bin/google-chrome',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
]
	.filter(Boolean)
	.find((candidate) => existsSync(candidate));

if (!CHROME) {
	console.error('No Chrome/Edge found. Set CHROME_PATH to the executable.');
	process.exit(1);
}

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = process.env.SHOT_DIR ?? fileURLToPath(new URL('../screenshots/', import.meta.url));
const QUERY = process.argv[2] ?? 'lofi beats';

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
	executablePath: CHROME,
	headless: true,
	args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--mute-audio']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
	for (const key of ['flavour:queue', 'flavour:history', 'flavour:mixes', 'flavour:recents', 'flavour:panels']) {
		localStorage.removeItem(key);
	}
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts?.ready);
await sleep(1200);
await page.screenshot({ path: `${OUT}/m1-home.png` });

// search: the panel floats over the page
await page.click('#search-input');
await page.type('#search-input', QUERY, { delay: 20 });
await page.waitForFunction(() => document.querySelectorAll('.panel .track-row').length > 0, { timeout: 20000 });
await sleep(700);
await page.screenshot({ path: `${OUT}/m2-overlay.png` });

// committed results page
await page.keyboard.press('Enter');
await page.waitForFunction(() => location.pathname === '/search', { timeout: 10000 });
await page.waitForFunction(() => document.querySelectorAll('.tray .rows .row').length > 0, { timeout: 20000 });
await sleep(900);
await page.screenshot({ path: `${OUT}/m3-results.png` });

// play the top hit, then scroll a little: mini player docked above the tabs
await page.evaluate(() => document.querySelector('.tray .rows .row .hit')?.click());
await sleep(6000);
await page.evaluate(() => window.scrollTo(0, 200));
await sleep(500);
await page.screenshot({ path: `${OUT}/m4-playing.png` });

const state = await page.evaluate(() => {
	const txt = (s) => document.querySelector(s)?.textContent?.trim() ?? null;
	const mini = document.querySelector('.mini');
	const play = document.querySelector('.mini .play');
	return {
		route: location.pathname + location.search,
		track: txt('.mini .meta strong'),
		miniVisible: !!mini && getComputedStyle(mini).display !== 'none',
		miniState: play?.getAttribute('data-state') ?? null,
		deckPosition: getComputedStyle(document.querySelector('.np')).position,
		viewport: `${innerWidth}x${innerHeight}`
	};
});
console.log(JSON.stringify(state, null, 2));
console.log(`shots written to ${OUT}`);

await browser.close();
