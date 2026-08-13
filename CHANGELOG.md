# Changelog

All notable changes to AcmeTicker are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-08-12

### Breaking changes

- **jQuery fully removed - no compatibility shim.** AcmeTicker is a zero-dependency vanilla JS library. The old `$('.ticker').AcmeTicker(options)` pattern no longer exists; call sites must migrate to `new AcmeTicker(element, options)` (see the README migration guide).
- **New build/API surface.** The package ships ESM, CommonJS and a global (IIFE) build plus TypeScript declarations. Vanilla usage is `new AcmeTicker(element, options)`.
- **`acmeTickerToggle` event payload changed.** The event is still fired on `document`, but handlers now read `event.detail.ticker` and `event.detail.paused` instead of receiving them as extra positional arguments. Code relying on the old extra-argument signature must switch to `e.detail`.
- **IE11 support dropped.** v2 targets ES2020+ evergreen browsers (Chrome/Edge 80+, Firefox 78+, Safari 14+). Note that v1 never actually loaded in IE11 either - its source used ES6 syntax, so the plugin failed with a parse error before the ticker could run.

### New features

- **`destroy()`** - removes the ticker and clears all plugin-applied DOM changes (wrap removed, inline styles cleared, `data-text` attributes removed, typed text restored). This fixes the long-standing "how do I reinitiate the plugin?" problem.
- **`update(options)`** - re-initializes an existing ticker with new options (including type changes) without a full teardown/re-mount.
- **`play()`, `pause()`, `toggle()`, `next()`, `prev()`** - programmatic control, matching the click-handler semantics of the v1 controls.
- **`acmeTickerCycle` event** - fired on `document` each time the ticker completes a full pass through its items, with a per-init cycle counter in `event.detail.count`. Fired after all items have been shown once for vertical/horizontal/typewriter and after each full list scroll for marquee.
- **`autoplay: 0` now yields a continuous, interruption-free loop** for vertical/horizontal/typewriter - the next transition starts the moment the previous one finishes. This was impossible in v1, where `autoplay: 0` caused overlapping, corrupted animations.
- **Marquee loop is now seamless.** v1 left a brief visible blank at each loop boundary; v2 duplicates the items internally so the window is never empty (duplicates are removed on `destroy()`).
- **ESM / CJS / global (IIFE) builds**, TypeScript types, and an `exports` map for modern bundlers.
- **Development tooling:** `npm run dev` now watches `src/`, regenerates bundles and type declarations on change, and serves the examples at `localhost:8080` (`npm run serve` for the server alone).
- **Accessibility:** tickers start paused under `prefers-reduced-motion` (playable on demand), and the ticker region is marked `aria-live="off"` / `role="region"`.
- **Modern animation:** RAF-driven transitions instead of jQuery `animate`/`setInterval`; marquee now uses CSS transforms with no per-frame layout reads.

### Behavior changes (deviations from v1)

- **Typewriter pause now genuinely pauses.** In v1, pausing (toggle/hover/focus) only set a flag - typing continued invisibly and the text blinked on unpause. In v2, pausing freezes the character reveal and resuming continues from the exact character where it stopped.
- **`destroy()` and `update()` clear `data-text` attributes** (restoring the full text into each item first), so no stale plugin-authored attributes are left in the DOM.
- **prev/next while paused are no-ops** (carried from v1 - do not rely on changing this). This now holds for the vertical/horizontal engine too, matching v1's `isPause` check in the manual-navigation path.
- **Marquee resume-from-pause math fixed.** v1 computed the remaining distance from a document-absolute offset, which drifted whenever the ticker was not at page x=0. v2 tracks the position relative to its own container, so resume is exact at any page position.
- **Controls accept a broader type.** v1 required jQuery objects and crashed on selector strings; v2 accepts CSS selector strings, `HTMLElement`s and `NodeList`s.
- **`destroy()` clears plugin-applied styles** (wrap removed, duplicated marquee items removed, inline styles and `data-text` cleared, typed text restored) rather than restoring pre-existing inline style values.
- **Vertical/horizontal items rest at offset 0.** v1 applied a JS-computed `margin-top` (the rest offset) to inset items inside the ticker box, which leaked a fixed margin onto every item. v2 rests the current item at offset 0 with no inline margin, and hidden items get their positioning styles cleared, so no stale margins remain in the DOM. Vertical centering is left to consumer CSS.

### Bug fixes

- Re-init on the same element now destroys the previous instance cleanly instead of double-wrapping.
- Vertical and horizontal transitions now measure the newly current item while it is measurable, instead of reading zero dimensions from its hidden state.
- Empty or single-item tickers degrade gracefully instead of throwing.
- `speed <= 0` or empty lists no longer spin a degenerate infinite animation loop in marquee mode.

## [1.0.0] - 2019

The original jQuery plugin. Archives of the v1 source were removed along with the v2 rewrite; the v1 plugin remains available in earlier git history.
