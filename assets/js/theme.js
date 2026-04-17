// Apply theme immediately (before CSS renders) to prevent flash
(function () {
  var urlTheme = new URLSearchParams(window.location.search).get('theme');
  if (urlTheme === 'dark' || urlTheme === 'light') {
    document.documentElement.setAttribute('data-theme', urlTheme);
  }
  // No URL param → no attribute → CSS media query (system theme) takes over
}());

function _themeUpdateURL(theme) {
  try {
    var url = new URL(window.location.href);
    url.searchParams.set('theme', theme);
    history.replaceState(null, '', url.toString());
  } catch (e) {}
}

// Water-wave reveal animation when switching themes
function _themeRipple(x, y, applyChange) {
  var maxR = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  if (document.startViewTransition) {
    var tr = document.startViewTransition(applyChange);
    tr.ready.then(function () {
      document.documentElement.animate(
        {
          clipPath: [
            'circle(0px at ' + x + 'px ' + y + 'px)',
            'circle(' + maxR + 'px at ' + x + 'px ' + y + 'px)'
          ]
        },
        { duration: 500, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () {});
  } else {
    // Fallback: apply theme first, then show expanding overlay
    applyChange();
    var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()
      || (document.documentElement.getAttribute('data-theme') === 'dark' ? '#0a0a0a' : '#ffffff');
    var ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999', 'pointer-events:none',
      'background:' + bg,
      'clip-path:circle(0px at ' + x + 'px ' + y + 'px)',
      'transition:clip-path .5s ease-in-out'
    ].join(';');
    document.body.appendChild(ov);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ov.style.clipPath = 'circle(' + maxR + 'px at ' + x + 'px ' + y + 'px)';
      });
    });
    ov.addEventListener('transitionend', function () { ov.remove(); }, { once: true });
  }
}

// Public API
window.ThemeManager = {
  // Returns 'dark', 'light', or null (no URL param = follow system)
  get: function () {
    return document.documentElement.getAttribute('data-theme');
  },
  // Only accepts 'dark' or 'light'
  set: function (theme, x, y) {
    var self = this;
    var applyChange = function () {
      document.documentElement.setAttribute('data-theme', theme);
      _themeUpdateURL(theme);
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    };
    if (typeof x === 'number' && typeof y === 'number') {
      _themeRipple(x, y, applyChange);
    } else {
      applyChange();
    }
  },
  // Toggle: dark ↔ light
  cycle: function (x, y) {
    this.set(this.getEffective() === 'dark' ? 'light' : 'dark', x, y);
  },
  getEffective: function () {
    var t = this.get();
    return t || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
};

// Carry theme URL param when navigating to internal pages
document.addEventListener('click', function (e) {
  var link = e.target.closest && e.target.closest('a[href]');
  if (!link) return;
  var theme = document.documentElement.getAttribute('data-theme');
  if (!theme) return; // no user selection → let destination page use its own system default
  var href = link.getAttribute('href');
  if (!href || /^(https?:|mailto:|javascript:|tel:|#)/.test(href)) return;
  e.preventDefault();
  try {
    var url = new URL(href, window.location.href);
    url.searchParams.set('theme', theme);
    window.location.href = url.toString();
  } catch (err) {}
}, true);

// Global progressive image loading:
// 1) render low-res image first from assets/images/.lowres/
// 2) after window load, swap to full-res source
(function () {
  var PREPARED_ATTR = 'data-progressive-prepared';
  var FULL_ATTR = 'data-fullres-src';
  var LOW_ATTR = 'data-lowres-src';
  var OPT_OUT_ATTR = 'data-progressive-off';
  var candidates = [];

  function detectAssetPrefix() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute('src');
      if (!src || !/assets\/js\/theme\.js(\?|#|$)/.test(src)) continue;
      var parsed = normalizeURL(src);
      if (!parsed) continue;
      return parsed.pathname.replace(/assets\/js\/theme\.js$/, 'assets/');
    }
    return '/assets/';
  }

  var ASSET_PREFIX = detectAssetPrefix();
  var BASE = ASSET_PREFIX + 'images/';
  var LOWRES_BASE = BASE + '.lowres/';

  function injectStyles() {
    if (document.getElementById('progressive-image-style')) return;
    var style = document.createElement('style');
    style.id = 'progressive-image-style';
    style.textContent = [
      '.progressive-image{transition:filter .28s ease, opacity .28s ease;}',
      '.progressive-image.is-lowres{filter:blur(10px);opacity:.92;}',
      '.progressive-image.is-fullres{filter:none;opacity:1;}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function normalizeURL(url) {
    try {
      return new URL(url, window.location.href);
    } catch (e) {
      return null;
    }
  }

  function shouldHandle(img) {
    if (!img) return false;
    if (img.getAttribute(PREPARED_ATTR) === '1') return false;
    if (img.getAttribute(OPT_OUT_ATTR) === '1') return false;

    var raw = img.getAttribute('src');
    if (!raw || /^(data:|blob:)/i.test(raw)) return false;

    var parsed = normalizeURL(raw);
    if (!parsed) return false;
    if (parsed.origin !== window.location.origin) return false;
    if (parsed.pathname.indexOf(BASE) !== 0) return false;
    if (parsed.pathname.indexOf(LOWRES_BASE) === 0) return false;

    return true;
  }

  function toLowresURL(fullURL) {
    var parsed = normalizeURL(fullURL);
    if (!parsed || parsed.pathname.indexOf(BASE) !== 0) return null;
    parsed.pathname = LOWRES_BASE + parsed.pathname.slice(BASE.length);
    return parsed.toString();
  }

  function markLow(img) {
    img.classList.add('progressive-image', 'is-lowres');
    img.classList.remove('is-fullres');
  }

  function markFull(img) {
    img.classList.add('progressive-image', 'is-fullres');
    img.classList.remove('is-lowres');
  }

  function prepareImage(img) {
    if (!shouldHandle(img)) return;

    var fullURL = normalizeURL(img.getAttribute('src'));
    if (!fullURL) return;

    var lowURL = toLowresURL(fullURL.toString());
    if (!lowURL) return;

    img.setAttribute(PREPARED_ATTR, '1');
    img.setAttribute(FULL_ATTR, fullURL.toString());
    img.setAttribute(LOW_ATTR, lowURL);
    img.decoding = 'async';
    markLow(img);

    // If low-res file is missing, fail fast to full-res.
    var onLowError = function () {
      img.removeEventListener('error', onLowError);
      img.src = fullURL.toString();
      markFull(img);
    };
    img.addEventListener('error', onLowError);

    img.src = lowURL;
    candidates.push(img);
  }

  function swapToFull(img) {
    if (!img || !img.isConnected) return;
    var fullURL = img.getAttribute(FULL_ATTR);
    if (!fullURL) return;

    var preload = new Image();
    preload.decoding = 'async';
    preload.src = fullURL;

    var commit = function () {
      if (!img.isConnected) return;
      img.src = fullURL;
      markFull(img);
    };

    if (typeof preload.decode === 'function') {
      preload.decode().then(commit).catch(function () {
        if (preload.complete) commit();
        else {
          preload.onload = commit;
          preload.onerror = commit;
        }
      });
      return;
    }

    if (preload.complete) commit();
    else {
      preload.onload = commit;
      preload.onerror = commit;
    }
  }

  function prepareAllInDOM() {
    var imgs = document.querySelectorAll('img[src]');
    imgs.forEach(prepareImage);
  }

  function swapAllToFull() {
    candidates.forEach(swapToFull);
  }

  injectStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareAllInDOM, { once: true });
  } else {
    prepareAllInDOM();
  }

  // Respect user requirement: load high-res only after full page load.
  window.addEventListener('load', function () {
    swapAllToFull();
  }, { once: true });
})();
