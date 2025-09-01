// Geek Theme JavaScript - Enhanced Interactions and Effects

class GeekTheme {
  constructor() {
    this.init();
  }

  init() {
    this.setupMatrixRain();
    this.setupScrollEffects();
    this.setupTypingEffects();
    this.setupParticleSystem();
    this.setupGlitchEffects();
    this.setupTerminalEffects();
  }

  // Matrix Rain Effect
  setupMatrixRain() {
    // Guard: reuse existing container if already present (avoid duplicates)
    let matrixContainer = document.getElementById('matrixBg');
    if (!matrixContainer) {
      matrixContainer = document.createElement('div');
      matrixContainer.className = 'matrix-bg';
      matrixContainer.id = 'matrixBg';
      document.body.appendChild(matrixContainer);
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
    const columns = Math.floor(window.innerWidth / 20);
    
    for (let i = 0; i < columns; i++) {
      this.createMatrixColumn(matrixContainer, i * 20, chars);
    }
  }

  createMatrixColumn(container, x, chars) {
    const column = document.createElement('div');
    column.style.position = 'absolute';
    column.style.left = x + 'px';
    column.style.top = '-100px';
    column.style.color = '#00ff41';
    column.style.fontFamily = 'monospace';
    column.style.fontSize = '14px';
    column.style.opacity = '0.6';
    column.style.pointerEvents = 'none';
    column.style.zIndex = '-1';

    let y = 0;
    const speed = Math.random() * 2 + 1;
    
    const animate = () => {
      if (y > window.innerHeight) {
        y = -20;
        column.textContent = chars[Math.floor(Math.random() * chars.length)];
      }
      
      y += speed;
      column.style.top = y + 'px';
      
      if (Math.random() < 0.02) {
        column.textContent = chars[Math.floor(Math.random() * chars.length)];
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
    container.appendChild(column);
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

    // Observe all cards and sections
    document.querySelectorAll('.card, .article-card, .skill-card, .terminal-window').forEach(el => {
      observer.observe(el);
    });

    // Parallax effect for hero sections
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.hero-section, .article-hero');
      
      parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    });
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

  // Particle System
  setupParticleSystem() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      opacity: 0.1;
    `;
    document.body.appendChild(particleContainer);

    for (let i = 0; i < 50; i++) {
      this.createParticle(particleContainer);
    }
  }

  createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: 2px;
      height: 2px;
      background: var(--accent-green);
      border-radius: 50%;
      pointer-events: none;
    `;

    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;

    particle.style.left = x + 'px';
    particle.style.top = y + 'px';

    const animate = () => {
      let newX = parseFloat(particle.style.left) + vx;
      let newY = parseFloat(particle.style.top) + vy;

      if (newX < 0 || newX > window.innerWidth) vx *= -1;
      if (newY < 0 || newY > window.innerHeight) vy *= -1;

      particle.style.left = newX + 'px';
      particle.style.top = newY + 'px';

      requestAnimationFrame(animate);
    };

    animate();
    container.appendChild(particle);
  }

  // Glitch Effects
  setupGlitchEffects() {
    const glitchElements = document.querySelectorAll('.glitch');
    
    glitchElements.forEach(element => {
      let glitchInterval;
      
      const startGlitch = () => {
        glitchInterval = setInterval(() => {
          element.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
          element.style.textShadow = `
            ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px var(--accent-green),
            ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px var(--accent-blue)
          `;
        }, 50);
      };

      const stopGlitch = () => {
        clearInterval(glitchInterval);
        element.style.transform = 'translate(0, 0)';
        element.style.textShadow = 'none';
      };

      element.addEventListener('mouseenter', startGlitch);
      element.addEventListener('mouseleave', stopGlitch);
    });
  }

  // Terminal Effects
  setupTerminalEffects() {
    const terminalWindows = document.querySelectorAll('.terminal-window');
    
    terminalWindows.forEach(terminal => {
      // Add typing sound effect (optional)
      const typeSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      
      // Add cursor blink effect
      const cursor = terminal.querySelector('.typing-cursor');
      if (cursor) {
        setInterval(() => {
          cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
        }, 500);
      }

      // Add terminal glow effect on hover
      terminal.addEventListener('mouseenter', () => {
        terminal.style.boxShadow = '0 0 40px rgba(0, 255, 65, 0.6)';
      });

      terminal.addEventListener('mouseleave', () => {
        terminal.style.boxShadow = 'var(--terminal-shadow)';
      });
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
      if (window.scrollY > 100) {
        this.nav.style.background = 'rgba(26, 26, 26, 0.95)';
        this.nav.style.backdropFilter = 'blur(20px)';
        this.nav.style.borderBottom = '2px solid var(--accent-green)';
      } else {
        this.nav.style.background = 'var(--bg-secondary)';
        this.nav.style.backdropFilter = 'blur(10px)';
        this.nav.style.borderBottom = '2px solid var(--border-color)';
      }
    }, 16);

    window.addEventListener('scroll', handleScroll);
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
    const cards = document.querySelectorAll('.card, .article-card, .skill-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.02)';
        card.style.boxShadow = '0 20px 40px rgba(0, 255, 65, 0.2)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = '0 10px 30px rgba(0, 255, 65, 0.1)';
      });
    });
  }

  setupCardAnimations() {
    const cards = document.querySelectorAll('.card, .article-card, .skill-card');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => {
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
    const buttons = document.querySelectorAll('.btn, .action-btn, .article-button');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-3px)';
        button.style.boxShadow = '0 10px 30px rgba(0, 255, 65, 0.4)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 5px 15px rgba(0, 255, 65, 0.2)';
      });
    });
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

// Initialize all enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GeekTheme();
  new EnhancedNavigation();
  new EnhancedCards();
  new EnhancedButtons();
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

  .nav-menu a.active {
    background: var(--accent-green);
    color: var(--bg-primary);
  }
`;
document.head.appendChild(style);
