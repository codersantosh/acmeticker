# AcmeTicker - News Ticker

A lightweight, zero-dependency vanilla JS library for advanced news tickers. Successor to the v1 jQuery plugin: same four ticker types and options, modern animation (RAF), TypeScript types, and no jQuery anywhere.

Demo: [Gutentor News Ticker](https://www.demo.gutentor.com/news-ticker/)

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
    prev: '.acme-news-ticker-prev',
    next: '.acme-news-ticker-next',
    toggle: '.acme-news-ticker-pause'
  }
});
```

### Plain script tag (no bundler)

```html
<script src="acmeticker.umd.js"></script>
<script>
  new AcmeTicker(document.querySelector('.my-news-ticker'), { type: 'horizontal', direction: 'right' });
</script>
```

The UMD build exposes a global `AcmeTicker` class (with `AcmeTicker.DEFAULTS` as a static property).

## Available Options

| Option | Default | Type | Description |
| --- | --- | --- | --- |
| `type` | `'horizontal'` | `'vertical' \| 'horizontal' \| 'marquee' \| 'typewriter'` | Ticker engine. |
| `autoplay` | `2000` | `number` | Vertical/horizontal: pause between transitions (recommended 4000). Typewriter: hold time after the text is fully revealed (recommended 2000). Not used by marquee. |
| `speed` | `50` | `number` | Vertical/horizontal: transition duration in ms (recommended 600). Typewriter: delay per character in ms (recommended 50). Marquee: travel speed in px/ms (recommended 0.05). |
| `direction` | `'up'` | `'up' \| 'down' \| 'left' \| 'right'` | `up`/`down` for vertical; `left`/`right` for horizontal and marquee. Not used by typewriter. |
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
    prev: document.querySelector('.acme-news-ticker-prev'),
    next: document.querySelector('.acme-news-ticker-next'),
    toggle: document.querySelector('.acme-news-ticker-pause')
  }
});
```

## API

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

Working demos for all four types live in the `examples/vanilla/` folder, using module scripts and `new AcmeTicker(...)`:

- `examples/vanilla/vertical.html`
- `examples/vanilla/horizontal.html`
- `examples/vanilla/marquee.html`
- `examples/vanilla/typewriter.html`

Serve the repo root with any static server (module scripts require HTTP) and open e.g. `examples/vanilla/vertical.html`.

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

1. **jQuery is fully removed.** Use `new AcmeTicker(el, options)` (import from `acmeticker`, or the UMD global). There is no shim, so jQuery-based initialization must be replaced with the class API above.
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
npm run dev        # esbuild watch
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest (jsdom)
npm run build      # dist/ bundles + type declarations
```

## License

MIT
