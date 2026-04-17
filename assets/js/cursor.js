(function () {
  const ROOT = document.documentElement;
  const STORE_KEY = '__customCursorState';

  const interactiveSelector = 'a, button, .btn, .article-button, .action-btn, .filter-btn, [role="button"], .modal-close, input, textarea, [contenteditable="true"]';
  const textLikeSelector = 'input, textarea, [contenteditable="true"]';
  const finePointerQuery = window.matchMedia('(pointer:fine)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = window[STORE_KEY] || {
    container: null,
    cursor: null,
    initialized: false,
    listenersBound: false,
    lastX: Math.max(12, Math.round(window.innerWidth / 2)),
    lastY: Math.max(12, Math.round(window.innerHeight / 2))
  };
  window[STORE_KEY] = state;

  function shouldEnable() {
    return finePointerQuery.matches && !reducedMotionQuery.matches;
  }

  function setActiveClass(active) {
    ROOT.classList.toggle('custom-cursor-active', !!active);
  }

  function ensureDom() {
    if (!document.body) return false;

    if (!state.container || !state.container.isConnected) {
      state.container = document.createElement('div');
      state.container.className = 'cursor-trail';
      state.container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(state.container);
    }

    if (!state.cursor || !state.cursor.isConnected) {
      state.cursor = document.createElement('div');
      state.cursor.className = 'cursor-main';
      state.cursor.style.opacity = '0';
      state.container.appendChild(state.cursor);
    } else if (state.cursor.parentElement !== state.container) {
      state.container.appendChild(state.cursor);
    }

    return true;
  }

  function updatePosition(x, y, visible) {
    if (!state.cursor) return;
    state.lastX = x;
    state.lastY = y;
    state.cursor.style.left = x + 'px';
    state.cursor.style.top = y + 'px';
    if (visible) state.cursor.style.opacity = '1';
  }

  function ensureCursorVisible() {
    if (!shouldEnable()) {
      teardown();
      return;
    }
    if (!ensureDom()) return;
    setActiveClass(true);
    updatePosition(state.lastX, state.lastY, true);
  }

  function teardown() {
    setActiveClass(false);
    if (state.cursor) {
      state.cursor.classList.remove('cursor-hover', 'cursor-click', 'cursor-text');
    }
    if (state.container && state.container.isConnected) {
      state.container.remove();
    }
    state.container = null;
    state.cursor = null;
  }

  function createClickRipple(x, y) {
    if (!state.container) return;
    const ripple = document.createElement('div');
    ripple.style.position = 'fixed';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = '4px';
    ripple.style.height = '4px';
    ripple.style.marginLeft = '-2px';
    ripple.style.marginTop = '-2px';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'radial-gradient(circle, rgba(255, 217, 61, 0.8) 0%, rgba(255, 107, 107, 0.4) 50%, transparent 100%)';
    ripple.style.boxShadow = '0 0 20px rgba(255, 217, 61, 0.6)';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '9999';
    ripple.style.transform = 'translate3d(0,0,0) scale(1)';
    ripple.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
    state.container.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.style.transform = 'translate3d(0,0,0) scale(20)';
      ripple.style.opacity = '0';
    });

    setTimeout(() => {
      if (ripple.isConnected) ripple.remove();
    }, 600);
  }

  function closestMatch(target, selector) {
    return target && target.closest ? target.closest(selector) : null;
  }

  function onPointerMove(e) {
    if (!state.cursor || !state.container || !ROOT.classList.contains('custom-cursor-active')) {
      ensureCursorVisible();
    }
    updatePosition(e.clientX, e.clientY, true);
  }

  function onMouseEnter() {
    ensureCursorVisible();
    if (state.cursor) state.cursor.style.opacity = '1';
  }

  function onMouseLeave() {
    if (state.cursor) state.cursor.style.opacity = '0';
  }

  function onMouseOver(e) {
    if (!state.cursor) return;
    const target = closestMatch(e.target, interactiveSelector);
    if (!target) return;
    state.cursor.classList.add('cursor-hover');
    if (target.matches(textLikeSelector)) {
      state.cursor.classList.add('cursor-text');
    }
  }

  function onMouseOut(e) {
    if (!state.cursor) return;
    const target = closestMatch(e.target, interactiveSelector);
    if (!target) return;
    const related = e.relatedTarget;
    if (related && target.contains(related)) return;
    state.cursor.classList.remove('cursor-hover', 'cursor-text');
  }

  function onMouseDown(e) {
    if (!state.cursor || !state.container || !ROOT.classList.contains('custom-cursor-active')) {
      ensureCursorVisible();
    }
    if (!state.cursor) return;
    state.cursor.classList.add('cursor-click');
    createClickRipple(e.clientX, e.clientY);
  }

  function onMouseUp() {
    if (state.cursor) state.cursor.classList.remove('cursor-click');
  }

  function onPageShow() {
    ensureCursorVisible();
  }

  function onPageHide() {
    if (state.cursor) state.cursor.style.opacity = '0';
  }

  function onVisibilityChange() {
    if (!document.hidden) ensureCursorVisible();
  }

  function onWindowFocus() {
    ensureCursorVisible();
  }

  function onMediaChange() {
    if (shouldEnable()) ensureCursorVisible();
    else teardown();
  }

  function addMediaListener(query, handler) {
    if (query.addEventListener) query.addEventListener('change', handler);
    else if (query.addListener) query.addListener(handler);
  }

  function bindListeners() {
    if (state.listenersBound) return;
    state.listenersBound = true;

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    addMediaListener(finePointerQuery, onMediaChange);
    addMediaListener(reducedMotionQuery, onMediaChange);
  }

  function init() {
    bindListeners();
    state.initialized = true;
    ensureCursorVisible();
  }

  if (state.initialized) {
    ensureCursorVisible();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
