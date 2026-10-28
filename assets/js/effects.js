// Global effects & enhancements

document.addEventListener('DOMContentLoaded', function () {
  initFloatingTOC();
  initScrollReveal();
  initBackToTop();
  initUptimeCounter();
  initMidResSwap();
  if (window.lucide) window.lucide.createIcons();
});

function initScrollReveal() {
  var enable = window.AppEffects ? window.AppEffects.isEnabled() && !window.AppEffects.isReduced() : true;
  if (!enable) return;
  var els = document.querySelectorAll('.reveal');
  if (!els.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        setTimeout(function () { e.target.classList.remove('reveal', 'in'); }, 1800);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
}

function initBackToTop() {
  var btn = document.getElementById('backToTop');
  if (!btn) return;
  function handleScroll() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    btn.classList.toggle('show', scrollTop > 200);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  handleScroll();
}

function initUptimeCounter() {
  var dEl = document.getElementById('uptime-days');
  var hEl = document.getElementById('uptime-hours');
  var mEl = document.getElementById('uptime-mins');
  var sEl = document.getElementById('uptime-secs');
  if (!dEl || !hEl || !mEl || !sEl) return;
  var launch = new Date('2023-10-08T13:13:00+08:00');
  function tick() {
    var diff = Math.floor((Date.now() - launch) / 1000);
    dEl.textContent = String(Math.floor(diff / 86400)).padStart(3, '0');
    hEl.textContent = String(Math.floor(diff % 86400 / 3600)).padStart(2, '0');
    mEl.textContent = String(Math.floor(diff % 3600 / 60)).padStart(2, '0');
    sEl.textContent = String(diff % 60).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
}

function initMidResSwap() {
  document.querySelectorAll('img[data-st], img[data-tl]').forEach(function (img) {
    var u = img.getAttribute('data-st') || img.getAttribute('data-tl');
    if (!u) return;
    img.src = u.replace('assets/images/', 'assets/images/.lowres/');
    var big = new Image();
    big.src = u.replace('assets/images/', 'assets/images/.mid/');
    (big.decode ? big.decode() : Promise.resolve())
      .then(function () { img.src = big.src; })
      .catch(function () { img.src = u; });
  });
}

function initFloatingTOC() {
  // Find the currently active TOC (visible one for bilingual articles)
  var tocs = document.querySelectorAll('.toc');
  if (tocs.length === 0) return;

  var activeToc = null;
  // If multiple (bilingual), try to find the one that is currently displayed
  // If we can't determine visibility right away, default to the first one and let it be re-evaluated
  for (var i = 0; i < tocs.length; i++) {
    // If it's inside a .lang-zh or .lang-en that is currently display:none, skip
    var parent = tocs[i].closest('.lang-en, .lang-zh');
    if (!parent || window.getComputedStyle(parent).display !== 'none') {
      activeToc = tocs[i];
      break;
    }
  }
  
  if (!activeToc) activeToc = tocs[0];

  // Also hide all original inline TOCs and their preceding heading
  document.querySelectorAll('.toc').forEach(function(toc) {
    toc.classList.add('inline-toc-hidden');
    var prev = toc.previousElementSibling;
    if (prev && prev.tagName === 'H2') {
      prev.classList.add('inline-toc-hidden');
    }
  });

  // Re-run this check when language changes
  window.addEventListener('langchange', function() {
    var wrapper = document.querySelector('.floating-toc-wrapper');
    if (wrapper) wrapper.remove();
    // Remove the hidden classes so we can re-evaluate
    document.querySelectorAll('.inline-toc-hidden').forEach(function(el) {
      el.classList.remove('inline-toc-hidden');
    });
    initFloatingTOC();
  });

  var ul = activeToc.querySelector('ul');
  if (!ul) return;

  // Build Floating Wrapper
  var wrapper = document.createElement('div');
  wrapper.className = 'floating-toc-wrapper';

  // Handle (Toggle button)
  var handle = document.createElement('div');
  handle.className = 'floating-toc-handle';
  handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>';
  
  // Content container
  var content = document.createElement('div');
  content.className = 'floating-toc-content';
  
  var title = document.createElement('h3');
  // Localize the title based on the active language
  var isZh = document.documentElement.getAttribute('data-lang') === 'zh' || document.documentElement.lang === 'zh-CN';
  title.textContent = isZh ? '目录' : 'Contents';
  
  var clonedUl = ul.cloneNode(true);
  
  content.appendChild(title);
  content.appendChild(clonedUl);
  
  wrapper.appendChild(handle);
  wrapper.appendChild(content);
  
  document.body.appendChild(wrapper);

  // Interaction logic
  var isHovered = false;
  var isClicked = false;

  function show() {
    wrapper.classList.add('visible');
  }

  function hide() {
    if (!isHovered && !isClicked) {
      wrapper.classList.remove('visible');
    }
  }

  wrapper.addEventListener('mouseenter', function() {
    isHovered = true;
    show();
  });

  wrapper.addEventListener('mouseleave', function() {
    isHovered = false;
    hide();
  });

  handle.addEventListener('click', function(e) {
    e.stopPropagation();
    isClicked = !isClicked;
    if (isClicked) show();
    else hide();
  });

  // Click outside to close if it was opened by click
  document.addEventListener('click', function(e) {
    if (isClicked && !wrapper.contains(e.target)) {
      isClicked = false;
      hide();
    }
  });

  // Scroll spy (highlight active section)
  var links = clonedUl.querySelectorAll('a');
  var headings = [];
  links.forEach(function(link) {
    var id = link.getAttribute('href').substring(1);
    var target = document.getElementById(id);
    if (target) {
      headings.push({ link: link, target: target });
      // Smooth scroll on click
      link.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      });
    }
  });

  if (headings.length > 0) {
    var observer = new IntersectionObserver(function(entries) {
      // Find the most visible heading
      var visibleEntries = entries.filter(function(e) { return e.isIntersecting; });
      if (visibleEntries.length > 0) {
        // Clear all active
        links.forEach(function(l) { l.classList.remove('active'); });
        
        // Find corresponding link for the first visible entry
        var activeId = visibleEntries[0].target.id;
        var activeLink = clonedUl.querySelector('a[href="#' + activeId + '"]');
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    }, {
      rootMargin: '-80px 0px -40% 0px',
      threshold: 0
    });

    headings.forEach(function(h) {
      observer.observe(h.target);
    });
  }
}
