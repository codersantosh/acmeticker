# AcmeTicker - News Ticker

[![Live demo](https://img.shields.io/badge/live%20demo-github%20pages-1974d2)](https://codersantosh.github.io/acmeticker/)

A modern, zero-dependency vanilla JS library for advanced news tickers with vertical, horizontal, marquee and typewriter engines, full RTL support, and TypeScript types. Modern successor to the v1 jQuery plugin: same four ticker types and options, 60fps RAF animation, and zero dependencies.

Demo: [Gutentor News Ticker](https://www.demo.gutentor.com/news-ticker/) &middot; [Live examples](https://codersantosh.github.io/acmeticker/examples/index.html)

## Ticker Types

- Vertical
- Horizontal
- Marquee
- Typewriter

## Installation

```bash
npm install acmeticker
```

### Vanilla (recommended)

```js
import { AcmeTicker } from 'acmeticker';

new AcmeTicker(document.querySelector('.my-news-ticker'), {
  type: 'vertical',
  speed: 600,
  controls: {
    prev: '.at-ticker-prev',
    next: '.at-ticker-next',
    toggle: '.at-ticker-pause'
  }
});
```

### Plain script tag (no bundler)

```html
<script src="dist/acmeticker.min.js"></script>
<script>
  new AcmeTicker(document.querySelector('.my-news-ticker'), { type: 'horizontal', direction: 'right' });
</script>
```

The global build exposes an `AcmeTicker` class on `window` (with `AcmeTicker.DEFAULTS` as a static property).

## React and other frameworks

AcmeTicker is framework-agnostic - it is vanilla JS with no dependencies and works anywhere you can reach a real DOM element. `sideEffects: false` keeps it tree-shakeable, and TypeScript declarations ship with the package.

React:

```jsx
import { useEffect, useRef } from 'react';
import { AcmeTicker } from 'acmeticker';

function NewsTicker() {
  const listRef = useRef(null);

  useEffect(() => {
    const ticker = new AcmeTicker(listRef.current, { type: 'vertical', speed: 600 });
    return () => ticker.destroy(); // clear timers, RAF and listeners on unmount
  }, []);

  return (
    <ul ref={listRef}>
      <li>First headline</li>
      <li>Second headline</li>
    </ul>
  );
}
```

A runnable React demo (all four ticker types, styled with the atomic CSS) lives in [`examples/react/`](examples/react/). Start it with:

```sh
npm run demo:react
```

then open http://localhost:8085/react/index.html.

Vue:

```js
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { AcmeTicker } from 'acmeticker';

const list = ref(null);
let ticker;
onMounted(() => { ticker = new AcmeTicker(list.value, { type: 'marquee' }); });
onBeforeUnmount(() => ticker?.destroy());
```

Svelte:

```svelte
<script>
  import { onMount } from 'svelte';
  import { AcmeTicker } from 'acmeticker';
  let list;
  onMount(() => { const t = new AcmeTicker(list, { type: 'horizontal' }); return () => t.destroy(); });
</script>

<ul bind:this={list}><li>One</li><li>Two</li></ul>
```

Server-side rendering: importing the module is safe in Node (all DOM access is guarded), but create the ticker only in a client lifecycle hook (`useEffect` / `onMounted` / `onMount`), and always call `destroy()` when the component unmounts.

## Available Options

| Option | Default | Type | Description |
| --- | --- | --- | --- |
| `type` | `'horizontal'` | `'vertical' \| 'horizontal' \| 'marquee' \| 'typewriter'` | Ticker engine. |
| `autoplay` | `2000` | `number` | Vertical/horizontal: pause between transitions (recommended 4000). Typewriter: hold time after the text is fully revealed (recommended 2000). Not used by marquee. |
| `speed` | `50` | `number` | Vertical/horizontal: transition duration in ms (recommended 600). Typewriter: delay per character in ms (recommended 50). Marquee: travel speed in px/ms (recommended 0.05). |
| `direction` | `'up'` | `'up' \| 'down' \| 'left' \| 'right'` | `up`/`down` for vertical; `left`/`right` for horizontal and marquee. Not used by typewriter. On RTL pages `left`/`right` are logical (see [Right-to-left](#right-to-left-rtl)). |
| `rtl` | `'auto'` | `'auto' \| boolean` | `'auto'` mirrors `left`/`right` when the ticker is inside an RTL context; `true`/`false` force it on or off. |
| `pauseOnFocus` | `true` | `boolean` | Pause while the ticker region has focus. |
| `pauseOnHover` | `true` | `boolean` | Pause while the pointer is over the ticker. |
| `controls` | `{ prev: '', next: '', toggle: '' }` | `object` | Control targets. Each accepts a CSS selector string, an `HTMLElement`, or a `NodeList`/array of elements. `prev`/`next` are not used by marquee (v1 parity). |

### Ticker timing

The vertical, horizontal and typewriter engines follow the v1 cadence: each transition/character reveal runs for `speed` milliseconds, then the ticker waits `autoplay` milliseconds before the next one.

Set `autoplay: 0` for a continuous, interruption-free loop - the next transition starts as soon as the previous one finishes. This works reliably in v2; in v1, `autoplay: 0` caused overlapping, corrupted animations.

The marquee is always continuous and ignores `autoplay`. In v1 its loop had a brief visible blank at each cycle boundary (the list teleported off-screen before the next copy entered); v2 duplicates the items internally so the window is never empty - the duplicates are removed again on `destroy()`. Manual `prev`/`next` navigation is unaffected by the timing settings.

```js
const ticker = new AcmeTicker(el, {
  type: 'vertical',
  autoplay: 4000,
  speed: 600,
  direction: 'up',
  pauseOnFocus: true,
  pauseOnHover: true,
  controls: {
    prev: document.querySelector('.at-ticker-prev'),
    next: document.querySelector('.at-ticker-next'),
    toggle: document.querySelector('.at-ticker-pause')
  }
});
```

## API

### Right-to-left (RTL)

`direction` is **logical**: `left` and `right` follow the page's text direction. On RTL pages (`dir="rtl"` on the ticker, an ancestor, or `<html>`), horizontal and marquee tickers automatically mirror, so a default marquee scrolls in the reading direction of an Arabic or Hebrew page with no extra configuration:

```js
// Arabic page (dir="rtl"): scrolls right-to-left automatically
new AcmeTicker(document.querySelector('.my-news-ticker'), { type: 'marquee' });
```

Detection respects `dir="auto"` and CSS `direction: rtl` too. The `rtl` option overrides detection (`rtl: true` forces mirroring on an LTR page; `rtl: false` forces physical direction on an RTL page). Vertical and typewriter tickers are direction-neutral and are never affected. In RTL, horizontal items rest on the label side (the box's right edge) and enter from off-screen, mirroring the LTR layout. In the example stylesheet, RTL pages also mirror the control layout: the label moves to the right (flexbox) and the controls flip to the left with right-side divider borders.

Runnable demos: [`examples/rtl.html`](examples/rtl.html) (all four tickers auto-mirrored under `dir="rtl"`, plus an `rtl: false` override section) and the React RTL page at `examples/react/rtl.html`.

### Methods

| Method | Description |
| --- | --- |
| `play()` | Resume a paused ticker. |
| `pause()` | Pause the ticker (current item/text/position is preserved). |
| `toggle()` | Flip play/pause state. |
| `next()` | Show the next item immediately (not supported by marquee). |
| `prev()` | Show the previous item immediately (not supported by marquee). |
| `update(options)` | Re-initialize with new options (including a type change) without re-mounting. |
| `destroy()` | Remove the ticker and clear all plugin-applied DOM changes (wrap removed, duplicated marquee items removed, inline styles and `data-text` attributes cleared, typed text restored). |

### Properties

| Property | Description |
| --- | --- |
| `element` | The ticker `<ul>` element. |
| `wrap` | The generated `.acmeticker-wrap` container (positioned relative, `aria-live="off"`). |
| `options` | The resolved options (defaults merged with what was passed). |
| `paused` | Whether the ticker is currently paused. |

### Events

- `acmeTickerToggle` - fired on `document` whenever the ticker is toggled. Read the payload from `event.detail`:

```js
document.addEventListener('acmeTickerToggle', (event) => {
  const { ticker, paused } = event.detail;
});
```

The event fires only when the ticker is toggled explicitly (via the toggle control or `toggle()`); hover/focus pauses do not emit it, and a ticker that starts paused (e.g. under `prefers-reduced-motion`) does not emit it at mount - the button glyph syncs after the first toggle. A common pattern is syncing the toggle button's icon with the paused state - the examples style a play glyph via an `.is-paused` class:

```js
document.addEventListener('acmeTickerToggle', (event) => {
  const { ticker, paused } = event.detail;
  const pauseBtn = ticker.closest('.at-ticker')?.querySelector('.at-ticker-pause');
  pauseBtn?.classList.toggle('is-paused', paused);
});
```

```css
.at-ticker-controls button.at-ticker-pause.is-paused:before {
  /* replace the pause bars with a play triangle */
}
```

On RTL pages the example stylesheet mirrors the prev/next chevrons automatically (via `[dir="rtl"]` and `:dir(rtl)` selectors).

- `acmeTickerCycle` - fired on `document` whenever the ticker completes a full pass through its items. `count` is the number of completed cycles since initialization (per instance; `update()` resets it). A cycle means: all items shown once for vertical/horizontal/typewriter (the initial item returns to the front), or one full list scroll for marquee. Manual `prev()`/`next()` navigation restarts the current pass, so it does not count toward a cycle:

```js
document.addEventListener('acmeTickerCycle', (event) => {
  const { ticker, count } = event.detail;
});
```

Both events are native `CustomEvent`s.

### Multiple instances

Multiple tickers on one page are independent. Creating a new ticker on an element that already has one destroys the previous instance first.

## Accessibility

- Tickers start paused when the user prefers reduced motion; they can still be started on demand via the toggle control or `play()`.
- The ticker region is marked `aria-live="off"` with `role="region"`.
- Control buttons are keyboard-operable and receive clicks as native `button` elements.

## Examples

Working demos for all four types live in the `examples/` folder. They load the global build like a WordPress-enqueued script:

```html
<script src="../dist/acmeticker.min.js"></script>
<script>
  document.querySelectorAll('.my-news-ticker').forEach((el) => {
    new AcmeTicker(el, { type: 'vertical', speed: 600 });
  });
</script>
```

- [All types on a single page](https://codersantosh.github.io/acmeticker/examples/index.html) (`examples/index.html` locally)
- [Vertical](https://codersantosh.github.io/acmeticker/examples/vertical.html)
- [Horizontal](https://codersantosh.github.io/acmeticker/examples/horizontal.html)
- [Marquee](https://codersantosh.github.io/acmeticker/examples/marquee.html)
- [Typewriter](https://codersantosh.github.io/acmeticker/examples/typewriter.html)
- [Arabic / RTL demo](https://codersantosh.github.io/acmeticker/examples/rtl.html) (all types under `dir="rtl"`, plus an `rtl: false` override)
- [React demo](https://codersantosh.github.io/acmeticker/examples/react/index.html) (run `npm run demo:react` for the local version)
- [React RTL demo](https://codersantosh.github.io/acmeticker/examples/react/rtl.html) (run `npm run demo:react` for the local version)

The demos are styled with the [Atomic CSS](https://github.com/codersantosh/atomic-css) utility framework (`examples/atomic.min.css`, vendored - refresh it by re-copying from the atomic-css repo) plus a small ticker customization layer (`examples/at-ticker.css`) that defines component theme `--at-*` variables and glyph rules. The ticker animation itself needs no CSS. Open `examples/index.html` directly in a browser, or serve the repo root and visit `/examples/`.

## Styling

The engines apply all animation mechanics as inline styles (positioning, display, opacity, `margin-top`/`left` offsets, `transform`, list width), so no library CSS is strictly required for JavaScript execution. As a consumer you only need to provide:

- a container with a fixed `height` and `overflow: hidden` (otherwise slide/typewriter effects have no visible boundary), and
- whatever look-and-feel you want for the ticker bar, label and controls.

### Portable Ticker CSS Bundle

For production-ready styling out of the box, the ticker component is portable as a pair:
1. **`atomic.min.css`** — the lightweight utility framework ([Atomic CSS](https://github.com/codersantosh/atomic-css), vendored in [`examples/atomic.min.css`](examples/atomic.min.css)).
2. **`at-ticker.css`** — the ticker component stylesheet ([`examples/at-ticker.css`](examples/at-ticker.css)) defining scoped `--at-*` CSS variables, control button glyphs (arrows, pause/play toggle), and automatic RTL layout mirroring.

You can copy both files into your project or load them directly:

```html
<!-- Portable Atomic CSS + Ticker CSS pair -->
<link rel="stylesheet" href="examples/atomic.min.css">
<link rel="stylesheet" href="examples/at-ticker.css">

<div class="at-ctnr">
  <div class="at-ticker at-flx at-pos at-h at-bdr at-bg-cl at-m at-box-szg">
    <div class="at-ticker-label at-bg-cl at-cl at-p at-flx-srnk-0">News</div>
    <div class="at-ticker-box at-h at-ovf at-p at-flx-grw-1 at-box-szg">
      <ul class="my-news-ticker">
        <li><a href="#">First headline</a></li>
        <li><a href="#">Second headline</a></li>
      </ul>
    </div>
    <div class="at-ticker-controls at-ticker-controls-horizontal at-pos at-flx at-h">
      <button aria-label="Previous" class="at-ticker-arrow at-ticker-prev at-w at-h at-bdr at-bg-cl at-cur at-p at-pos at-box-szg"></button>
      <button aria-label="Toggle playback" class="at-ticker-pause at-w at-h at-bdr at-bg-cl at-cur at-p at-pos at-box-szg"></button>
      <button aria-label="Next" class="at-ticker-arrow at-ticker-next at-w at-h at-bdr at-bg-cl at-cur at-p at-pos at-box-szg"></button>
    </div>
  </div>
</div>
```

Re-theming is as simple as overriding the scoped `--at-*` CSS variables in `at-ticker.css` (e.g. `--at-bg-cl`, `--at-bdr-cl`, `--at-h`). Controls are plain `<button>`s referenced through the `controls` option (`'.at-ticker-prev'`, `'.at-ticker-next'`, `'.at-ticker-pause'`). RTL layout mirrors automatically under `dir="rtl"` without additional configuration.


## Browser support

AcmeTicker targets ES2020+ evergreen browsers: Chrome and Edge 80+, Firefox 78+, Safari 14+. IE11 and other legacy engines are not supported - note that v1 never actually ran in IE11 either (its source used ES6 syntax, so the plugin failed to load entirely rather than failing at runtime).

## Migrating from v1

v1 was a jQuery plugin (`$('.ticker').AcmeTicker({...})`). **v2 is vanilla-only - jQuery is fully removed and no `$.fn.AcmeTicker` shim exists.** Existing jQuery-based call sites (WordPress themes/plugins, Gutentor's News Ticker block) must migrate to the class API:

```js
// v1
jQuery(document).ready(function ($) {
  $('.my-news-ticker').AcmeTicker({
    type: 'horizontal',
    direction: 'right',
    controls: { prev: $('.prev'), next: $('.next'), toggle: $('.pause') }
  });
});

// v2
new AcmeTicker(document.querySelector('.my-news-ticker'), {
  type: 'horizontal',
  direction: 'right',
  controls: { prev: '.prev', next: '.next', toggle: '.pause' }
});
```

The observable behavior is preserved with a small number of documented differences:

1. **jQuery is fully removed.** Use `new AcmeTicker(el, options)` (import from `acmeticker`, or the global build). There is no shim, so jQuery-based initialization must be replaced with the class API above.
2. **Controls accept selectors, elements and NodeLists.** v1 required jQuery objects and crashed on selector strings; v2 accepts all of them.
3. **`acmeTickerToggle` payload.** The event still fires on `document`, but the ticker/paused values moved from extra positional arguments to `event.detail` (`{ ticker, paused }`).
4. **Typewriter pause actually pauses.** v1 kept typing while paused and the text blinked on resume; v2 freezes the reveal and resumes from the exact character.
5. **`prev`/`next` while paused are no-ops** (a quirk carried from v1 - do not rely on it).
6. **`destroy()`/`update()` clear `data-text`.** v2 owns the `data-text` attribute for its lifecycle and removes it (restoring the full text) on teardown. Do not stash your own `data-text` on ticker items while a ticker is mounted.
7. **Marquee resume is position-exact.** v1's resume-from-pause could drift when the ticker was not at page x=0; v2 is correct at any page position.
8. **New lifecycle API.** `destroy()` and `update()` are new - there was no clean way to reinit or tear down in v1.
9. **Transition cadence carried from v1.** Vertical/horizontal/typewriter wait a full `autoplay` between transitions by default; use `autoplay: 0` for a continuous loop (impossible in v1, where it corrupted the animations).
10. **New `acmeTickerCycle` event.** v1 had no cycle-completion signal; v2 fires one per full pass (see Events).
11. **Marquee loop is seamless.** v1 showed a brief blank at each loop boundary; v2 duplicates the items internally so the loop is continuous (duplicates are removed on `destroy()` - do not rely on the marquee item count in the DOM while mounted).

## Development

```bash
npm install
npm run dev        # watch src/, rebuild bundles + types, and serve the examples at localhost:8080
npm run serve      # static server for the examples only
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest (jsdom)
npm run build      # dist/ bundles + type declarations (one-shot)
```

`npm run dev` watches `src/`, regenerates the bundles and type declarations on every change, and serves the repo at `http://localhost:8080/` (set `PORT` to change the port).

The React demo bundles (`examples/react/bundle.js`, `examples/react/rtl.js`) embed the shipped ESM build, so regenerate them after any `src/` change with `npm run demo:react` (or the two esbuild commands it runs).

## License

MIT
