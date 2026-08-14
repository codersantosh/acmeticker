// src/controls.ts
function toElements(target) {
  if (!target) {
    return [];
  }
  if (typeof target === "string") {
    return Array.from(document.querySelectorAll(target));
  }
  if (target instanceof HTMLElement) {
    return [target];
  }
  return Array.from(target);
}
function resolveControls(options) {
  return {
    prev: toElements(options.controls.prev),
    next: toElements(options.controls.next),
    toggle: toElements(options.controls.toggle)
  };
}
function bindControls(controls, callbacks) {
  const handlers = [];
  const bind = (els, type, callback) => {
    if (!callback) {
      return;
    }
    for (const el of els) {
      const handler = (event) => {
        callback(event);
      };
      el.addEventListener(type, handler);
      handlers.push([el, type, handler]);
    }
  };
  bind(controls.prev, "click", callbacks.onPrev);
  bind(controls.next, "click", callbacks.onNext);
  bind(controls.toggle, "click", callbacks.onToggle);
  return () => {
    for (const [el, type, handler] of handlers) {
      el.removeEventListener(type, handler);
    }
    handlers.length = 0;
  };
}
function bindHoverFocus(el, options, handlers) {
  const binds = [];
  if (options.pauseOnHover) {
    if (handlers.onHoverEnter) {
      binds.push([el, "mouseenter", handlers.onHoverEnter]);
    }
    if (handlers.onHoverLeave) {
      binds.push([el, "mouseleave", handlers.onHoverLeave]);
    }
  }
  if (options.pauseOnFocus) {
    if (handlers.onFocusIn) {
      binds.push([el, "focusin", handlers.onFocusIn]);
    }
    if (handlers.onFocusOut) {
      binds.push([el, "focusout", handlers.onFocusOut]);
    }
  }
  for (const [target, type, handler] of binds) {
    target.addEventListener(type, handler);
  }
  return () => {
    for (const [target, type, handler] of binds) {
      target.removeEventListener(type, handler);
    }
  };
}

// src/dom.ts
function parsePx(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function outerWidth(el) {
  const cs = getComputedStyle(el);
  return el.offsetWidth + parsePx(cs.marginLeft) + parsePx(cs.marginRight);
}
function outerHeight(el) {
  const cs = getComputedStyle(el);
  return el.offsetHeight + parsePx(cs.marginTop) + parsePx(cs.marginBottom);
}
function requestFrame(callback) {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(Date.now()), 16);
}
function cancelFrame(id) {
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}
function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function resolveRTL(rtl, el) {
  if (typeof rtl === "boolean") {
    return rtl;
  }
  const dirEl = el.closest("[dir]");
  if (dirEl) {
    const dir = dirEl.getAttribute("dir")?.toLowerCase();
    if (dir === "rtl") {
      return true;
    }
    if (dir === "ltr") {
      return false;
    }
  }
  return typeof getComputedStyle === "function" && getComputedStyle(el).direction === "rtl";
}
function createWrap(el) {
  const wrap = document.createElement("div");
  wrap.className = "acmeticker-wrap";
  wrap.style.position = "relative";
  wrap.setAttribute("aria-live", "off");
  wrap.setAttribute("role", "region");
  el.before(wrap);
  wrap.appendChild(el);
  return wrap;
}
function unwrap(el, wrap) {
  if (wrap.parentNode && el.parentNode === wrap) {
    wrap.replaceWith(el);
  }
}
function directLiChildren(el) {
  return Array.from(el.querySelectorAll(":scope > li"));
}
function hideAllButFirst(el) {
  for (const li of directLiChildren(el).slice(1)) {
    li.style.display = "none";
  }
}

// src/engines/marquee.ts
var LEGACY_WIDTH_FUDGE = 5;
var MarqueeEngine = class {
  constructor(host) {
    this.rafID = null;
    this.position = 0;
    this.listWidth = 0;
    this.wrapWidth = 0;
    this.originalCount = 0;
    this.legFrom = 0;
    this.legTo = 0;
    this.legDuration = 0;
    this.startTs = null;
    this.completedCycles = 0;
    this.resizeObserver = null;
    this.unbindResize = null;
    this.frame = (ts) => {
      if (this.startTs === null) {
        this.startTs = ts;
      }
      const elapsed = ts - this.startTs;
      const progress = Math.min(1, elapsed / this.legDuration);
      this.position = this.legFrom + (this.legTo - this.legFrom) * progress;
      this.applyTransform();
      if (progress >= 1) {
        this.rafID = null;
        this.legComplete();
        return;
      }
      this.rafID = requestFrame(this.frame);
    };
    this.handleResize = () => {
      this.remeasure();
    };
    this.host = host;
    const rawDirection = host.options.direction;
    this.directionRight = host.rtl ? rawDirection !== "right" : rawDirection === "right";
    this.speed = host.options.speed;
  }
  init() {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
    const ul = this.host.element;
    ul.style.position = "absolute";
    const originals = directLiChildren(ul);
    for (const li of originals) {
      li.style.display = "inline-block";
      li.style.marginRight = "10px";
    }
    this.wrapWidth = outerWidth(this.host.wrap);
    ul.style.width = "10000px";
    let listWidth = 0;
    for (const li of originals) {
      listWidth += outerWidth(li) + LEGACY_WIDTH_FUDGE;
    }
    this.listWidth = listWidth;
    this.originalCount = originals.length;
    if (listWidth > 0) {
      let totalWidth = listWidth;
      while (totalWidth < this.wrapWidth + listWidth || totalWidth < listWidth * 2) {
        for (const li of originals) {
          ul.appendChild(li.cloneNode(true));
        }
        totalWidth += listWidth;
      }
      ul.style.width = `${totalWidth}px`;
    } else {
      ul.style.width = `${listWidth * 2}px`;
    }
    this.position = 0;
    this.attachResizeTracking();
    if (listWidth <= 0 || !(this.speed > 0)) {
      return;
    }
    this.applyTransform();
    if (this.host.paused) {
      return;
    }
    this.startLeg(0, -listWidth, listWidth / this.speed);
  }
  prev() {
  }
  next() {
  }
  pause() {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
  }
  resume() {
    if (this.rafID !== null) {
      return;
    }
    if (this.listWidth <= 0 || !(this.speed > 0)) {
      return;
    }
    this.startLeg(this.position, -this.listWidth, (this.position + this.listWidth) / this.speed);
  }
  destroy() {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
    this.detachResizeTracking();
    const ul = this.host.element;
    const lis = directLiChildren(ul);
    while (lis.length > this.originalCount) {
      const last = lis.pop();
      if (last) {
        last.remove();
      }
    }
    ul.style.position = "";
    ul.style.width = "";
    ul.style.transform = "";
    for (const li of directLiChildren(ul)) {
      li.style.display = "";
      li.style.marginRight = "";
    }
  }
  startLeg(from, to, duration) {
    if (!(duration > 0)) {
      this.position = to;
      this.applyTransform();
      this.legComplete();
      return;
    }
    this.legFrom = from;
    this.legTo = to;
    this.legDuration = duration;
    this.startTs = null;
    this.rafID = requestFrame(this.frame);
  }
  legComplete() {
    this.completedCycles++;
    this.host.emitCycle(this.completedCycles);
    this.position = 0;
    this.applyTransform();
    this.startLeg(0, -this.listWidth, this.listWidth / this.speed);
  }
  applyTransform() {
    const offset = this.host.rtl ? this.wrapWidth - this.listWidth * 2 : 0;
    const x = this.directionRight ? this.wrapWidth - this.listWidth * 2 - this.position : this.position;
    this.host.element.style.transform = `translateX(${x - offset}px)`;
  }
  attachResizeTracking() {
    this.detachResizeTracking();
    if (typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(() => this.remeasure());
      this.resizeObserver.observe(this.host.wrap);
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleResize);
      this.unbindResize = () => window.removeEventListener("resize", this.handleResize);
    }
  }
  detachResizeTracking() {
    if (this.resizeObserver !== null) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.unbindResize !== null) {
      this.unbindResize();
      this.unbindResize = null;
    }
  }
  remeasure() {
    this.wrapWidth = outerWidth(this.host.wrap);
    this.applyTransform();
  }
};

// src/engines/typewriter.ts
var TypewriterEngine = class {
  constructor(host) {
    this.intervalID = null;
    this.timeoutID = null;
    this.typeEl = null;
    this.wrapEl = null;
    this.allText = "";
    this.count = 0;
    this.stepCount = 0;
    this.completedCycles = 0;
    this.host = host;
  }
  init() {
    this.start();
  }
  prev() {
    if (this.host.paused) {
      return;
    }
    this.navigate("prev");
  }
  next() {
    if (this.host.paused) {
      return;
    }
    this.navigate("next");
  }
  pause() {
    this.clearInterval();
    this.clearTimeout();
  }
  resume() {
    if (this.intervalID !== null) {
      return;
    }
    if (this.typeEl === null) {
      this.start();
      return;
    }
    this.arm();
  }
  destroy() {
    this.clearInterval();
    this.clearTimeout();
    for (const li of directLiChildren(this.host.element)) {
      li.style.display = "";
      li.style.opacity = "";
      const dataText = li.getAttribute("data-text");
      if (dataText) {
        const wrapEl = li.firstElementChild;
        if (wrapEl) {
          wrapEl.textContent = dataText;
        }
      }
      li.removeAttribute("data-text");
    }
  }
  start() {
    if (this.host.paused) {
      return;
    }
    const lis = directLiChildren(this.host.element);
    const typeEl = lis[0];
    if (!typeEl) {
      return;
    }
    const wrapEl = typeEl.firstElementChild;
    const dataText = typeEl.getAttribute("data-text");
    if (dataText && wrapEl) {
      wrapEl.textContent = dataText;
    }
    this.allText = (wrapEl ?? typeEl).textContent ?? "";
    for (const li of lis) {
      li.style.opacity = "0";
      li.style.display = "none";
    }
    this.typeEl = typeEl;
    this.wrapEl = wrapEl;
    this.count = 0;
    this.arm();
  }
  navigate(mode) {
    this.clearInterval();
    this.clearTimeout();
    this.stepCount = 0;
    const ul = this.host.element;
    const lis = directLiChildren(ul);
    if (mode === "prev") {
      const last = lis[lis.length - 1];
      if (last) {
        ul.prepend(last);
      }
    } else {
      const first = lis[0];
      if (first) {
        ul.appendChild(first);
      }
    }
    this.start();
  }
  arm() {
    if (this.intervalID !== null) {
      return;
    }
    const delay = Math.max(1, this.host.options.speed);
    this.intervalID = setInterval(() => this.type(), delay);
  }
  clearInterval() {
    if (this.intervalID !== null) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }
  clearTimeout() {
    if (this.timeoutID !== null) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  }
  type() {
    const typeEl = this.typeEl;
    if (!typeEl) {
      this.clearInterval();
      return;
    }
    this.count++;
    const typeText = this.allText.substring(0, this.count);
    if (!typeEl.getAttribute("data-text")) {
      typeEl.setAttribute("data-text", this.allText);
    }
    if (this.count <= this.allText.length) {
      if (this.wrapEl) {
        this.wrapEl.textContent = typeText;
      }
      typeEl.style.opacity = "1";
      typeEl.style.display = "block";
    } else {
      this.clearInterval();
      this.timeoutID = setTimeout(
        () => this.tNext(),
        Math.max(1, this.host.options.autoplay)
      );
    }
  }
  tNext() {
    const ul = this.host.element;
    const first = directLiChildren(ul)[0];
    if (first) {
      ul.appendChild(first);
    }
    this.clearTimeout();
    const itemCount = directLiChildren(ul).length;
    if (itemCount > 0) {
      this.stepCount++;
      if (this.stepCount >= itemCount) {
        this.completedCycles++;
        this.stepCount = 0;
        this.host.emitCycle(this.completedCycles);
      }
    }
    this.start();
  }
};

// src/engines/vertical-horizontal.ts
var SWING = (progress) => 0.5 - Math.cos(progress * Math.PI) / 2;
var VerticalHorizontalEngine = class {
  constructor(host) {
    this.intervalID = null;
    this.rafID = null;
    this.stepCount = 0;
    this.completedCycles = 0;
    this.animEl = null;
    this.animFrom = 0;
    this.animRest = 0;
    this.animDuration = 0;
    this.animElapsed = 0;
    this.animStartTs = null;
    this.animLastProgress = 0;
    this.frame = (ts) => {
      const el = this.animEl;
      if (el === null) {
        this.rafID = null;
        return;
      }
      if (this.animStartTs === null) {
        this.animStartTs = ts;
      }
      const total = this.animElapsed + (ts - this.animStartTs);
      const progress = Math.min(1, total / this.animDuration);
      if (progress >= 1) {
        el.style[this.styleProp()] = `${this.animRest}px`;
        this.rafID = null;
        this.clearAnimState();
        this.complete();
        return;
      }
      el.style[this.styleProp()] = `${this.animRest + (this.animFrom - this.animRest) * (1 - SWING(progress))}px`;
      this.animLastProgress = progress;
      this.rafID = requestFrame(this.frame);
    };
    this.host = host;
    this.horizontal = host.options.type === "horizontal";
  }
  init() {
    this.settle();
    if (!this.host.paused) {
      this.arm();
    }
  }
  prev() {
    if (this.host.paused) {
      return;
    }
    this.navigate("prev");
  }
  next() {
    if (this.host.paused) {
      return;
    }
    this.navigate("next");
  }
  pause() {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
      this.animElapsed = this.animLastProgress * this.animDuration;
    }
    this.clearInterval();
  }
  resume() {
    if (this.rafID !== null) {
      return;
    }
    if (this.animEl !== null && this.animElapsed < this.animDuration) {
      this.animStartTs = null;
      this.rafID = requestFrame(this.frame);
      return;
    }
    if (this.intervalID === null) {
      this.arm();
    }
  }
  destroy() {
    this.clearInterval();
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
    this.clearAnimState();
    for (const li of directLiChildren(this.host.element)) {
      li.style.display = "";
      li.style.opacity = "";
      li.style.position = "";
      li.style.marginTop = "";
      li.style.left = "";
      li.style.right = "";
      li.style.whiteSpace = "";
      li.style.maxWidth = "";
    }
  }
  arm() {
    if (this.intervalID !== null) {
      return;
    }
    const delay = Math.max(1, this.host.options.autoplay);
    this.intervalID = setInterval(() => this.tick(), delay);
  }
  clearInterval() {
    if (this.intervalID !== null) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }
  tick() {
    if (this.host.paused) {
      this.clearInterval();
      return;
    }
    if (this.rafID !== null) {
      return;
    }
    const lis = directLiChildren(this.host.element);
    const first = lis[0];
    if (!first) {
      return;
    }
    this.rotate("next");
    const animated = directLiChildren(this.host.element)[0];
    if (!animated) {
      return;
    }
    this.animate(animated);
  }
  navigate(mode) {
    if (this.rafID !== null) {
      cancelFrame(this.rafID);
      this.rafID = null;
    }
    this.clearAnimState();
    this.stepCount = 0;
    this.rotate(mode);
    this.settle();
    this.clearInterval();
    this.arm();
  }
  rotate(mode) {
    const ul = this.host.element;
    const lis = directLiChildren(ul);
    if (mode === "prev") {
      const last = lis[lis.length - 1];
      if (last) {
        ul.prepend(last);
      }
    } else {
      const first = lis[0];
      if (first) {
        ul.appendChild(first);
      }
    }
  }
  settle() {
    const ul = this.host.element;
    const styleProp = this.styleProp();
    for (const li of directLiChildren(ul)) {
      li.style.opacity = "0";
      li.style.display = "none";
      li.style.marginTop = "";
      li.style.left = "";
      li.style.right = "";
      this.applySingleLine(li);
    }
    const first = directLiChildren(ul)[0];
    if (first) {
      first.style.opacity = "1";
      first.style.position = "absolute";
      first.style.display = "block";
      first.style[styleProp] = "0px";
    }
  }
  applySingleLine(li) {
    if (!this.horizontal) {
      li.style.whiteSpace = "";
      li.style.maxWidth = "";
      return;
    }
    li.style.whiteSpace = "nowrap";
    li.style.maxWidth = "none";
  }
  styleProp() {
    if (this.horizontal) {
      return this.host.rtl ? "right" : "left";
    }
    return "marginTop";
  }
  visibleHeight() {
    const box = this.host.wrap.parentElement;
    if (!box) return 0;
    const cs = getComputedStyle(box);
    return box.clientHeight - (Number.parseFloat(cs.paddingTop) || 0) - (Number.parseFloat(cs.paddingBottom) || 0);
  }
  visibleWidth() {
    const box = this.host.wrap.parentElement;
    if (!box) return 0;
    const cs = getComputedStyle(box);
    return box.clientWidth - (Number.parseFloat(cs.paddingLeft) || 0) - (Number.parseFloat(cs.paddingRight) || 0);
  }
  animate(el) {
    const styleProp = this.styleProp();
    const negative = this.host.options.direction === "up" || this.host.options.direction === "right";
    el.style.display = "block";
    el.style.position = "absolute";
    const travel = this.horizontal ? negative ? outerWidth(el) : Math.max(outerWidth(el), this.visibleWidth()) : Math.max(outerHeight(el), this.visibleHeight());
    const from = negative ? -travel : travel;
    const rest = 0;
    for (const li of directLiChildren(this.host.element)) {
      li.style.opacity = "0";
      li.style.display = "none";
      li.style.marginTop = "";
      li.style.left = "";
      li.style.right = "";
      this.applySingleLine(li);
    }
    el.style.opacity = "1";
    el.style.position = "absolute";
    el.style.display = "block";
    el.style[styleProp] = `${from}px`;
    const duration = this.host.options.speed;
    if (!(duration > 0)) {
      el.style[styleProp] = `${rest}px`;
      this.complete();
      return;
    }
    this.animEl = el;
    this.animFrom = from;
    this.animRest = rest;
    this.animDuration = duration;
    this.animElapsed = 0;
    this.animLastProgress = 0;
    this.animStartTs = null;
    this.rafID = requestFrame(this.frame);
  }
  clearAnimState() {
    this.animEl = null;
    this.animFrom = 0;
    this.animRest = 0;
    this.animDuration = 0;
    this.animElapsed = 0;
    this.animStartTs = null;
    this.animLastProgress = 0;
  }
  complete() {
    const itemCount = directLiChildren(this.host.element).length;
    if (itemCount > 0) {
      this.stepCount++;
      if (this.stepCount >= itemCount) {
        this.completedCycles++;
        this.stepCount = 0;
        this.host.emitCycle(this.completedCycles);
      }
    }
    this.clearInterval();
    this.arm();
  }
};

// src/engines/index.ts
function createEngine(type, host) {
  switch (type) {
    case "vertical":
    case "horizontal":
      return new VerticalHorizontalEngine(host);
    case "marquee":
      return new MarqueeEngine(host);
    case "typewriter":
      return new TypewriterEngine(host);
  }
}

// src/types.ts
var DEFAULTS = {
  type: "horizontal",
  autoplay: 2e3,
  speed: 50,
  direction: "up",
  rtl: "auto",
  pauseOnFocus: true,
  pauseOnHover: true,
  controls: {
    prev: "",
    next: "",
    toggle: ""
  }
};

// src/AcmeTicker.ts
var instances = /* @__PURE__ */ new WeakMap();
var AcmeTicker = class {
  constructor(element, options) {
    this.explicitPaused = false;
    this.isDestroyed = false;
    this.isHoverPaused = false;
    this.isFocusPaused = false;
    const existing = instances.get(element);
    if (existing) {
      existing.destroy();
    }
    this.element = element;
    this.options = mergeOptions(options);
    this.paused = prefersReducedMotion();
    this.explicitPaused = this.paused;
    this.rtl = resolveRTL(this.options.rtl, this.element);
    this.wrap = createWrap(this.element);
    hideAllButFirst(this.element);
    this.controls = resolveControls(this.options);
    this.unbindControls = this.bindControlHandlers();
    this.unbindHoverFocus = this.bindInteractionHandlers();
    this.engine = createEngine(this.options.type, this);
    instances.set(element, this);
    this.engine.init();
  }
  play() {
    this.explicitPaused = false;
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this.engine.resume();
  }
  pause() {
    this.explicitPaused = true;
    if (this.paused) {
      return;
    }
    this.paused = true;
    this.engine.pause();
  }
  toggle() {
    if (this.paused) {
      this.play();
    } else {
      this.pause();
    }
    this.emitToggle(this.paused);
  }
  next() {
    this.engine.next();
  }
  prev() {
    this.engine.prev();
  }
  update(options) {
    Object.assign(this.options, options, {
      controls: { ...this.options.controls, ...options?.controls }
    });
    this.rtl = resolveRTL(this.options.rtl, this.element);
    this.unbindControls();
    this.unbindHoverFocus();
    this.controls = resolveControls(this.options);
    this.unbindControls = this.bindControlHandlers();
    this.unbindHoverFocus = this.bindInteractionHandlers();
    this.engine.destroy();
    hideAllButFirst(this.element);
    this.engine = createEngine(this.options.type, this);
    this.engine.init();
  }
  destroy() {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.engine.destroy();
    this.unbindControls();
    this.unbindHoverFocus();
    for (const li of directLiChildren(this.element)) {
      li.style.display = "";
    }
    if (instances.get(this.element) === this) {
      instances.delete(this.element);
    }
    unwrap(this.element, this.wrap);
  }
  emitToggle(paused) {
    document.dispatchEvent(
      new CustomEvent("acmeTickerToggle", {
        detail: { ticker: this.element, paused }
      })
    );
  }
  emitCycle(count) {
    document.dispatchEvent(
      new CustomEvent("acmeTickerCycle", {
        detail: { ticker: this.element, count }
      })
    );
  }
  bindControlHandlers() {
    const isMarquee = this.options.type === "marquee";
    const callbacks = {
      onPrev: isMarquee ? void 0 : (e) => this.handlePrev(e),
      onNext: isMarquee ? void 0 : (e) => this.handleNext(e),
      onToggle: (e) => this.handleToggle(e)
    };
    return bindControls(this.controls, callbacks);
  }
  bindInteractionHandlers() {
    return bindHoverFocus(this.element, this.options, {
      onHoverEnter: () => this.updateInteractionPause(true, this.isFocusPaused),
      onHoverLeave: () => this.updateInteractionPause(false, this.isFocusPaused),
      onFocusIn: () => this.updateInteractionPause(this.isHoverPaused, true),
      onFocusOut: () => this.updateInteractionPause(this.isHoverPaused, false)
    });
  }
  handlePrev(e) {
    e.preventDefault();
    this.engine.prev();
  }
  handleNext(e) {
    e.preventDefault();
    this.engine.next();
  }
  handleToggle(e) {
    if (this.options.type !== "marquee") {
      e.preventDefault();
    }
    this.toggle();
  }
  updateInteractionPause(hover, focus) {
    this.isHoverPaused = hover;
    this.isFocusPaused = focus;
    if (this.options.type === "marquee") {
      if (hover || focus) {
        this.engine.pause();
      } else {
        this.engine.resume();
      }
      return;
    }
    if (this.explicitPaused) {
      return;
    }
    const paused = hover || focus;
    if (this.paused === paused) {
      return;
    }
    this.paused = paused;
    if (paused) {
      this.engine.pause();
    } else {
      this.engine.resume();
    }
  }
};
function mergeOptions(options) {
  return {
    ...DEFAULTS,
    ...options,
    controls: {
      ...DEFAULTS.controls,
      ...options?.controls
    }
  };
}
export {
  AcmeTicker,
  DEFAULTS
};
//# sourceMappingURL=acmeticker.esm.js.map
