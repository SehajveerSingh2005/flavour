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
		return {
			theme: document.documentElement.dataset.theme,
			title: txt('.np .title'),
			artist: txt('.np .artist'),
			position: txt('.np .times span'),
			duration: txt('.np .times span:last-child'),
			playIcon: txt('.np .play'),
			ytTag: host?.tagName ?? null,
			results: document.querySelectorAll('.rows .row').length,
			queueCount: document.querySelectorAll('.list .row').length
		};
	});
}

// 1 ── load
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await waitFor(() => !!document.querySelector('#yt-host'), 20000, 'youtube host');
await page.evaluate(() => document.fonts?.ready);
await sleep(1200);
await shoot('01-empty-matcha');

// 2 ── flavour switch
await page.click('.picker-btn');
await sleep(350);
console.log('flavour picked:', await pickFlavour('Taro'));
await sleep(500);
await shoot('02-empty-taro');

// 3 ── search then results
await page.click('#search-input');
await page.type('#search-input', QUERY, { delay: 25 });
await waitFor(() => document.querySelectorAll('.rows .row').length > 0, 20000, 'search results');
await sleep(800);
await shoot('03-results-taro');

// 4 ── lucky: play the top hit
await page.click('form .btn--pop');
await waitFor(
	() => {
		const t = document.querySelector('.np .times span')?.textContent?.trim();
		return !!t && t !== '0:00';
	},
	25000,
	'playback to advance'
);
await sleep(1500);
await shoot('04-playing-taro');
console.log('while playing:', JSON.stringify(await state(), null, 1));

// 5 ── immersive mode
await page.click('.np .watch');
await sleep(1600);
await shoot('05-immersive');
await page.keyboard.press('Escape');
await sleep(700);

// 6 ── queue tab
await page.click('.tabs .tab:nth-child(2)');
await sleep(500);
await shoot('06-queue');

// 7 ── dark flavour
await page.click('.picker-btn');
await sleep(350);
console.log('flavour picked:', await pickFlavour('Espresso'));
await sleep(600);
await page.click('.tabs .tab:nth-child(1)');
await sleep(400);
await shoot('07-playing-espresso');

console.log('final:', JSON.stringify(await state(), null, 1));
console.log('problems:', problems.length ? problems : 'none');

await browser.close();
