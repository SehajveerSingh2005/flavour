# 🍵 FLAVOUR

**Music, freshly squeezed.** A flavourful YouTube-powered music player — search anything, play it like a real music app, and the video stays out of the way until you want it.

Born from a simple problem: no Spotify at work, but YouTube works fine.

![Playing in the Taro flavour](screenshots/05-playing-taro.png)

## Features

- **Search anything on YouTube** — keyless, powered by YouTube Music's internal API (clean artist / title / duration / square album art), with a regular YouTube fallback for the long tail
- **Search in two gears** — the field lives in the topbar and results float under it as you type (playable inline, ↑↓ · ↵ · esc); hit ↵ and it commits to a real `/search?q=` page you can refresh, bookmark and go back from
- **Albums & playlists** — search also returns album and playlist results; one click loads the whole collection into the queue, or save it as a mix
- **Mixes** — your own playlists: create, add from anywhere (every result row has an add menu), reorder, rename, delete, or save a whole album in one tap. Local-first, snapshotted, no account
- **Lucky** — plays the top hit immediately, `"artist - song"` style queries just work
- **Paste a YouTube link** — a video plays straight away, a playlist loads the whole list into the queue
- **Autoplay radio** — when the queue runs dry, YouTube Music's "up next" keeps the music going (toggle it in the queue header, or top up on demand)
- **Real player feel** — queue, play-next, shuffle, repeat, seek, volume, keyboard shortcuts
- **Drag-to-reorder** — queue and mix tracklists
- **Icon set, no emoji** — every control is a hand-drawn SVG in one `Icon.svelte`
- **Poster deck + up-next queue** — the rail holds a cover-forward deck with the record slipping out of the sleeve; when the queue opens the deck folds into a compact bar and the list takes the rail, so nothing is ever squeezed. The queue shows the current track plus the next one before you open it
- **Routed pages, one player** — home (library), search, mixes; the deck and hidden video never unmount, so playback is never interrupted by navigation
- **Recently played** — the last dozen tracks you played, one tap away on home (and cleared when you clear them)
- **Hidden playback** — the video runs behind the scenes at 320×180, so it stays audio-first
- **Immersive mode** — one press and the *same* video animates into a big squircle frame. Never reloads, never interrupts the audio
- **OS media controls** — Media Session API gives you working media keys and title/artist/artwork in the system media hub
- **8 flavours** — Matcha, Pistachio, Taro, Mango, Blueberry, Strawberry, Espresso, Vanilla
- **Persistence** — queue, mixes, volume, shuffle/repeat/radio and flavour survive reloads (localStorage)

| Immersive mode | Espresso, late night |
| --- | --- |
| ![Immersive mode](screenshots/06-immersive.png) | ![Espresso flavour](screenshots/08-espresso.png) |

| Shortcut cheat sheet | Mobile layout |
| --- | --- |
| ![Keyboard shortcuts](screenshots/09-shortcuts.png) | <img src="screenshots/m4-playing.png" alt="Mobile layout" width="300" /> |

## Stack

- **SvelteKit** (Svelte 5 runes) + TypeScript
- **Plain CSS design system** (`src/app.css`) — smooth neo-brutalism: chunky ink borders, hard offset shadows, squircle corners (`corner-shape`), mono metadata
- **One inline SVG icon set** (`src/lib/components/Icon.svelte`) — no icon fonts, no emoji
- **YouTube IFrame Player API** for playback, one player instance, two layouts
- **`youtubei.js`** in the server routes — keyless search, up-next radio, video/playlist link resolution, edge-cached
- **Vercel** for hosting (adapter-vercel)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # types + svelte diagnostics
```

No API keys, no `.env`, no accounts needed to run it.

## Keyboard shortcuts

| key | action |
| --- | --- |
| `space` / `k` | play / pause |
| `←` `→` | seek ±5s |
| `↑` `↓` | volume |
| `n` / `p` | next / previous track |
| `m` | mute |
| `s` | shuffle |
| `r` | repeat mode |
| `f` | toggle immersive mode |
| `/` | focus search |
| `?` | keyboard cheat sheet |
| `esc` | close overlays |

## Project layout

```
src/
├── app.css                     # design tokens, 8 flavour palettes, brutalist primitives
├── app.html                    # fonts + no-flash theme bootstrap
├── lib/
│   ├── components/             # NowPlaying (poster deck), QueuePanel (up-next +
│   │                           # full list), SearchField (topbar field + floating
│   │                           # results), ResultsList, TrackMenu (add/queue/mix),
│   │                           # MixTile, Tile, MiniPlayer, VideoDock, Icon,
│   │                           # Shortcuts, FlavourPicker, Toaster
│   ├── player.svelte.ts        # the player controller: queue + transport + radio + YouTube wiring
│   ├── search.svelte.ts        # client search state (text queries and pasted links)
│   ├── mixes.svelte.ts         # user-made mixes, persisted snapshots
│   ├── history.svelte.ts       # recently played, persisted
│   ├── ui.svelte.ts            # deck/queue accordion state, persisted
│   ├── theme.svelte.ts         # flavour switching + persistence
│   ├── quick.ts                # starter searches for empty states + lucky
│   ├── youtube.ts              # YouTube link parsing (shared client/server)
│   ├── mediaSession.ts         # OS media controls
│   ├── format.ts               # time formatting, title cleanup
│   ├── flavours.ts             # flavour metadata
│   ├── server/yt.ts            # shared Innertube client + track mappers
│   └── yt/loader.ts            # one-time IFrame API loader + minimal typings
└── routes/
    ├── +layout.svelte          # shell: topbar nav + search, persistent deck/queue rail
    ├── +page.svelte            # home: jump back in + your mixes
    ├── search/+page.svelte     # committed search results (/search?q=…)
    ├── mixes/+page.svelte      # all mixes
    ├── mixes/[id]/+page.svelte # one mix: play, reorder, rename, delete
    └── api/
        ├── search/+server.ts   # keyless search (YouTube Music + fallback) + album/playlist shelves
        ├── collection/+server.ts # load an album/playlist shelf into tracks
        ├── radio/+server.ts    # up-next radio for the current video
        └── resolve/+server.ts  # pasted video/playlist links → tracks
```

## Deploying to Vercel

1. Push this folder to a GitHub repository
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo
3. Framework preset is auto-detected as SvelteKit. No environment variables needed
4. Deploy — every push to `main` redeploys automatically

The `/api/search` route becomes a Vercel function, and search responses are cached at the edge for an hour (`s-maxage=3600`).

### Local builds on Windows

`npm run build` finishes the Vite build and then runs the Vercel adapter, which creates a symlink that Windows blocks unless **Developer Mode** is on (Settings → System → For developers). Deployment is unaffected (Vercel builds on Linux) and `npm run dev`, `npm run check` and the screenshot scripts all work locally either way.

## How the keyless search works

`/api/search` posts to YouTube's internal `youtubei/v1/search` using the `WEB_REMIX` (YouTube Music) client via `youtubei.js`:

- no Google Cloud project, no API key, no daily quota
- returns proper `artist` / `title` / `duration` instead of raw video titles, plus square album art
- falls back to a regular YouTube video search when a song isn't in the music catalogue
- it's unofficial, so if YouTube changes things, use the diagnostics below

`/api/radio` asks the music API for "up next" for the current video, and `/api/resolve` turns a pasted video/playlist URL into tracks. All three share one Innertube client in `src/lib/server/yt.ts` and cache at the edge.

There's also a small import map: `src/lib/yt/loader.ts` wraps the IFrame API with just the typings FLAVOUR uses.

## Notes and known quirks

- **Ads** still play inside the embed, and they can't be skipped while the player is hidden. An adblocker or a signed-in Premium session helps
- Embed-restricted / region-blocked videos are **skipped automatically** with a toast
- **Autoplay radio** comes from YouTube Music's up-next feed: it needs the current track to be in the music catalogue, otherwise it quietly gives up
- **Mobile browsers** may pause background playback when the screen locks — that's a browser limitation, not the app
- `youtubei.js` occasionally logs a parser warning (`TextBadge not found!`) while it JIT-generates the missing class; search and playback carry on — it's noise from the library, not the app
- Album art sets `referrerpolicy="no-referrer"`: some YouTube CDN images reject unknown referrers
- `static/robots.txt` disallows indexing — this is a personal toy, not a public service

## Dev scripts

| command | what it does |
| --- | --- |
| `npm run shots` | desktop smoke test (floating search → results page → play → immersive → queue → save a mix → flavours) + screenshots into `screenshots/` |
| `npm run shots:mobile` | the same flow at phone size |
| `node scripts/debug-play.mjs "query"` | playback diagnosis: state polling + console + failed requests |
| `node scripts/check-art-browser.mjs "query"` | album art diagnosis (referrer / size issues) |

Set `CHROME_PATH` if Chrome/Edge isn't in the default location.

## Ideas for later

- PWA install with an offline shell
- Floating always-on-top player via Document Picture-in-Picture
- Lyrics panel (YouTube captions are already being fetched by the embed)
- Sleep timer with a gentle volume fade
- Likes / favourites inside mixes
- Sharing mixes (needs a tiny backend: Vercel KV + a `/playlist/[id]` route)
- Voice search — "play <song> by <artist>"
- Crossfade-ish transitions between tracks
