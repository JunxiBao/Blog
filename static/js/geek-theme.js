// Geek Theme JavaScript - Enhanced Interactions and Effects
// Ensure back/forward cache restores trigger a refresh when requested
window.addEventListener('pageshow', (event) => {
  try {
    if (sessionStorage.getItem('forceReload') === '1') {
      sessionStorage.removeItem('forceReload');
      location.reload();
      return;
    }
    if (event.persisted) {
      location.reload();
    }
  } catch {}
});

class GeekTheme {
  constructor() {
    this.init();
  }

  init() {
    const canEffects = !(window.AppEffects && (window.AppEffects.isReduced() || !window.AppEffects.isEnabled()));
    if (canEffects) this.setupMatrixRain();
    if (canEffects) this.setupScrollEffects();
    if (canEffects) this.setupTypingEffects();
    if (canEffects) this.setupGlitchEffects();
    if (canEffects) this.setupTerminalEffects();
  }

  // Matrix Rain Effect — canvas-based, single RAF loop
  setupMatrixRain() {
    if (document.getElementById('matrixBg')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'matrixBg';
    canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:-1;opacity:0.06;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
    const fontSize = 14;
    let cols = 0, drops = new Float32Array(0), accentColor = '#00c768';

    const syncColor = () => {
      const c = getComputedStyle(document.documentElement).getPropertyValue('--accent-green').trim();
      accentColor = c || '#00c768';
    };
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const newCols = Math.floor(canvas.width / fontSize);
      if (newCols !== cols) {
        const prev = drops;
        drops = new Float32Array(newCols);
        for (let i = 0; i < newCols; i++) drops[i] = i < prev.length ? prev[i] : -(Math.random() * 30);
        cols = newCols;
      }
    };

    syncColor();
    resize();
    window.addEventListener('resize', GeekTheme.debounce(resize, 250));
    window.addEventListener('themechange', syncColor);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncColor);

    let animId;
    const draw = () => {
      // Fade existing pixels toward transparency to create the trailing effect
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 0.05;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.fillStyle = accentColor;
      ctx.font = `${fontSize}px monospace`;
      const h = canvas.height;
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * fontSize;
        if (y > 0) ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y);
        drops[i]++;
        if (y > h && Math.random() > 0.975) drops[i] = -(Math.random() * 20);
      }
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(animId); }
      else { animId = requestAnimationFrame(draw); }
    });
  }

  // Scroll Effects
  setupScrollEffects() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all cards and sections (排除reveal的skill-card)
    document.querySelectorAll('.card, .article-card, .skill-card:not(.reveal), .terminal-window').forEach(el => {
      observer.observe(el);
    });

    // Parallax effect for hero sections
    const onScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.hero-section, .article-hero');
      
      parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    };
    window.addEventListener('scroll', GeekTheme.throttle(onScroll, 16), { passive: true });
  }

  // Typing Effects
  setupTypingEffects() {
    const typingElements = document.querySelectorAll('.typing-effect');
    
    typingElements.forEach(element => {
      const text = element.textContent;
      element.textContent = '';
      element.style.borderRight = '2px solid var(--accent-green)';
      
      let i = 0;
      const typeWriter = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(typeWriter, 100);
        } else {
          element.style.borderRight = 'none';
        }
      };
      
      // Start typing when element is visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            typeWriter();
            observer.unobserve(entry.target);
          }
        });
      });
      
      observer.observe(element);
    });
  }

  // Glitch Effects
  setupGlitchEffects() {
    const glitchElements = document.querySelectorAll('.glitch');

    glitchElements.forEach(element => {
      let glitchInterval;

      const startGlitch = () => {
        glitchInterval = setInterval(() => {
          element.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
        }, 50);
      };

      const stopGlitch = () => {
        clearInterval(glitchInterval);
        element.style.transform = 'translate(0, 0)';
      };

      element.addEventListener('mouseenter', startGlitch);
      element.addEventListener('mouseleave', stopGlitch);
    });
  }

  // Terminal Effects
  setupTerminalEffects() {
    const terminalWindows = document.querySelectorAll('.terminal-window');

    terminalWindows.forEach(terminal => {
      // Add cursor blink effect
      const cursor = terminal.querySelector('.typing-cursor');
      if (cursor) {
        setInterval(() => {
          cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
        }, 500);
      }
    });
  }

  // Utility Functions
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Enhanced Navigation
class EnhancedNavigation {
  constructor() {
    this.nav = document.querySelector('.nav-container');
    this.mobileToggle = document.querySelector('.mobile-menu-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupScrollEffects();
    this.setupActiveLink();
  }

  setupMobileMenu() {
    if (!this.mobileToggle || !this.navMenu) return;

    this.mobileToggle.addEventListener('click', () => {
      this.mobileToggle.classList.toggle('active');
      this.navMenu.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.nav.contains(e.target)) {
        this.mobileToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
      }
    });

    // Close menu when clicking on links
    const navLinks = this.navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.mobileToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
      });
    });
  }

  setupScrollEffects() {
    if (!this.nav) return;

    const handleScroll = GeekTheme.throttle(() => {
      // Use CSS variables so manual theme overrides are respected
      this.nav.style.background = 'var(--bg-secondary)';
      this.nav.style.borderBottom = '2px solid var(--border-color)';
      this.nav.style.backdropFilter = 'none';
      this.nav.style.webkitBackdropFilter = 'none';
    }, 16);

    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }

  setupActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = this.navMenu?.querySelectorAll('a');
    
    if (navLinks) {
      navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
          link.classList.add('active');
        }
      });
    }
  }
}

// Enhanced Cards
class EnhancedCards {
  constructor() {
    this.init();
  }

  init() {
    this.setupCardHoverEffects();
    this.setupCardAnimations();
  }

  setupCardHoverEffects() {
    // CSS handles all hover effects; no JS box-shadow overrides needed
  }

  setupCardAnimations() {
    // 排除已经有reveal类的卡片，避免动画冲突
    const cards = document.querySelectorAll('.card, .article-card');
    const skillCards = document.querySelectorAll('.skill-card:not(.reveal)');
    const allCards = [...cards, ...skillCards];
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    allCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }
}

// Enhanced Buttons
class EnhancedButtons {
  constructor() {
    this.init();
  }

  init() {
    this.setupButtonEffects();
    this.setupRippleEffect();
  }

  setupButtonEffects() {
    // CSS handles all button hover effects; no JS box-shadow overrides needed
  }

  setupRippleEffect() {
    const buttons = document.querySelectorAll('.btn, .action-btn, .article-button');
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(0, 255, 65, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        `;

        button.style.position = 'relative';
        button.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
  }
}

// Theme Toggle Button — injected as last item in .nav-menu
class ThemeToggle {
  constructor() {
    this.btn = null;
    this.init();
  }

  init() {
    this.injectButton();
    this.updateButton();
    window.addEventListener('themechange', () => this.updateButton());
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!document.documentElement.getAttribute('data-theme')) this.updateButton();
    });
  }

  injectButton() {
    const navContent = document.querySelector('.nav-content');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (!navContent) return;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.id = 'themeToggle';

    btn.addEventListener('click', () => {
      if (!window.ThemeManager) return;
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      window.ThemeManager.cycle(x, y);
    });

    if (mobileToggle) {
      navContent.insertBefore(btn, mobileToggle);
    } else {
      navContent.appendChild(btn);
    }
    this.btn = btn;
  }

  updateButton() {
    if (!this.btn) return;
    const eff = window.ThemeManager
      ? window.ThemeManager.getEffective()
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    if (eff === 'dark') {
      this.btn.innerHTML = ThemeToggle.ICON_SUN;
      this.btn.title = 'Switch to light mode';
    } else {
      this.btn.innerHTML = ThemeToggle.ICON_MOON;
      this.btn.title = 'Switch to dark mode';
    }
  }

  static get ICON_SUN() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">' +
      '<circle cx="12" cy="12" r="5"/>' +
      '<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>' +
      '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
      '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>' +
      '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' +
      '</svg>';
  }

  static get ICON_MOON() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
      '</svg>';
  }
}

// Initialize all enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GeekTheme();
  new EnhancedNavigation();
  new EnhancedCards();
  new EnhancedButtons();
  new ThemeToggle();
  
  // Back button handler (elements with .back-button)
  document.addEventListener('click', (e) => {
    const backBtn = e.target.closest && e.target.closest('.back-button');
    if (!backBtn) return;
    e.preventDefault();
    try {
      sessionStorage.setItem('forceReload', '1');
    } catch {}
    setTimeout(() => {
      if (history.length > 1) {
        history.back();
      } else {
        location.href = '/src/passage.html';
      }
    }, 100);
  });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes animate-in {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-in {
    animation: animate-in 0.6s ease forwards;
  }

  .nav-open {
    overflow: hidden;
  }

  .nav-menu a.active,
  .nav-menu a.active:hover {
    background: var(--accent-green);
    color: var(--bg-primary);
    cursor: default;
  }

  .nav-menu a.active::before,
  .nav-menu a.active:hover::before {
    opacity: 0;
    left: -10px;
  }
`;
document.head.appendChild(style);
