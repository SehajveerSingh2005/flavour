// Desktop smoke test + screenshots.
//
//   npm run shots            → screenshots/*.png in the project
//   npm run shots -- "query" → search for something else
//
// Needs the dev server running (npm run dev) and Chrome or Edge installed.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHROME = [
	process.env.CHROME_PATH,
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
	'/usr/bin/google-chrome',
	'/usr/bin/chromium',
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
const QUERY = process.argv[2] ?? 'yung kai blue';

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
	executablePath: CHROME,
	headless: true,
	args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--mute-audio']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

const problems = [];
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
	if (message.type() !== 'error') return;
	const url = message.location()?.url ?? '';
	if (url.includes('localhost')) problems.push(`console: ${message.text()} (${url})`);
});

async function shoot(name) {
	await page.screenshot({ path: `${OUT}/${name}.png` });
	console.log(`shot: ${name}.png`);
}

async function waitFor(fn, timeout = 20000, label = 'condition') {
	const started = Date.now();
	while (Date.now() - started < timeout) {
		if (await page.evaluate(fn)) return true;
		await sleep(250);
	}
	console.log(`TIMED OUT waiting for ${label}`);
	return false;
}

function pickFlavour(name) {
	return page.evaluate((wanted) => {
		const rows = [...document.querySelectorAll('.picker .row')];
		const row = rows.find((r) => r.textContent?.toLowerCase().includes(wanted.toLowerCase()));
		if (!row) return false;
		row.click();
		return true;
	}, name);
}

function state() {
	return page.evaluate(() => {
		const txt = (selector) => document.querySelector(selector)?.textContent?.trim() ?? null;
		const host = document.querySelector('#yt-host');
		const play = document.querySelector('.np .play');
		return {
			route: location.pathname + location.search,
			theme: document.documentElement.dataset.theme,
			title: txt('.np .overlay-title') ?? txt('.np .bar-meta strong'),
			artist: txt('.np .overlay-artist') ?? txt('.np .bar-meta em'),
			position: txt('.np .scrub-row .time'),
			remaining: txt('.np .scrub-row .time:last-child'),
			playState: play?.getAttribute('data-state') ?? null,
			ytTag: host?.tagName ?? null,
			results: document.querySelectorAll('.tray .rows .row').length,
			mixes: JSON.parse(localStorage.getItem('flavour:mixes') || '[]').length
		};
	});
}

// 1 ── first run: home, nothing anywhere
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
	for (const key of ['flavour:queue', 'flavour:history', 'flavour:mixes', 'flavour:recents', 'flavour:panels']) {
		localStorage.removeItem(key);
	}
});
await page.reload({ waitUntil: 'domcontentloaded' });
await waitFor(() => !!document.querySelector('#yt-host'), 20000, 'youtube host');
await page.evaluate(() => document.fonts?.ready);
await sleep(1000);

// 0 ── first run: the welcome tour greets a fresh browser
if (await page.evaluate(() => !!document.querySelector('.onboarding'))) {
	await sleep(500);
	await shoot('00-welcome');
	await page.evaluate(() => document.querySelector('.onboarding .actions .btn--accent')?.click());
	await sleep(500);
}

await shoot('01-home-matcha');

// 2 ── flavour switch
await page.click('.picker-btn');
await sleep(350);
console.log('flavour picked:', await pickFlavour('Taro'));
await sleep(500);
await shoot('02-home-taro');

// 3 ── typing floats: live results over the page
await page.click('#search-input');
await page.type('#search-input', QUERY, { delay: 25 });
await waitFor(() => document.querySelectorAll('.panel .track-row').length > 0, 20000, 'overlay results');
await sleep(600);
await shoot('03-search-overlay');

// 4 ── enter commits to the results page
await page.keyboard.press('Enter');
await waitFor(() => location.pathname === '/search', 10000, 'search route');
await waitFor(() => document.querySelectorAll('.tray .rows .row').length > 0, 20000, 'search results');
await sleep(800);
await shoot('04-results-taro');

// 5 ── play the top hit
await page.evaluate(() => document.querySelector('.tray .rows .row .hit')?.click());
await waitFor(
	() => {
		const t = document.querySelector('.np .scrub-row .time')?.textContent?.trim();
		return !!t && t !== '0:00';
	},
	25000,
	'playback to advance'
);
await sleep(1200);
await shoot('05-playing-taro');
console.log('while playing:', JSON.stringify(await state(), null, 1));

// 5b ── lyrics on the playing track
await page.click('.lyrics-btn');
await waitFor(
	() => (document.querySelector('.lyrics-text')?.textContent?.trim().length ?? 0) > 40,
	20000,
	'lyrics'
);
await sleep(500);
await shoot('11-lyrics');
await page.click('.lyrics-close');
await sleep(400);

// 6 ── immersive mode: click the sleeve
await page.click('.np .poster-art');
await sleep(1600);
await shoot('06-immersive');
await page.keyboard.press('Escape');
await sleep(700);

// 7 ── queue open: the deck folds to a bar, the list takes the rail
await page.click('.queue-card .toggle');
await sleep(900);
await shoot('07-queue');
await page.click('.np .bar-btn');
await sleep(600);

// 8 ── save an album as a mix, then visit it
await page.evaluate(() => document.querySelector('.side-card .coll .save')?.click());
await waitFor(() => JSON.parse(localStorage.getItem('flavour:mixes') || '[]').length > 0, 20000, 'mix saved');
await sleep(500);
await page.goto(`${BASE}/mixes`, { waitUntil: 'domcontentloaded' });
await waitFor(() => !!document.querySelector('.mix-tile'), 10000, 'mix tiles');
await sleep(600);
await page.evaluate(() => document.querySelector('.mix-tile')?.click());
await waitFor(() => location.pathname.startsWith('/mixes/'), 10000, 'mix route');
await sleep(900);
await shoot('10-mix-page');

// 9 ── dark flavour
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await sleep(800);
await page.click('.picker-btn');
await sleep(350);
console.log('flavour picked:', await pickFlavour('Espresso'));
await sleep(600);
await shoot('08-espresso');

// 10 ── cheat sheet
await page.keyboard.press('?');
await sleep(500);
await shoot('09-shortcuts');
await page.keyboard.press('Escape');
await sleep(300);

console.log('final:', JSON.stringify(await state(), null, 1));
console.log('problems:', problems.length ? problems : 'none');

await browser.close();
