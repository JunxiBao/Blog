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
