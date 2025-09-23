(function(){
  const isFine = matchMedia('(pointer:fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isFine || reduced) return;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9998';
  canvas.style.mixBlendMode = 'screen';
  document.body.appendChild(canvas);

  let width = 0, height = 0;
  function resize(){
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Color palette adapts to color scheme
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  function getPalette(){
    const isDark = darkQuery.matches;
    // Low-key green tech palette: main neon green + subtle teal shades
    return isDark
      ? ['rgba(0,255,65,0.42)', 'rgba(0,190,120,0.28)', 'rgba(0,130,90,0.22)']
      : ['rgba(0,180,90,0.30)', 'rgba(0,220,120,0.24)', 'rgba(0,255,65,0.28)'];
  }
  let palette = getPalette();
  darkQuery.addEventListener('change', ()=>{ palette = getPalette(); });

  const particles = [];
  const maxParticles = 110; // lower density for subtle look

  function spawn(x, y){
    for (let i = 0; i < 4; i++) {
      if (particles.length >= maxParticles) { particles.shift(); }
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.9;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 32 + Math.random() * 28,
        size: 1.0 + Math.random() * 2.0,
        color: palette[(Math.random() * palette.length) | 0]
      });
    }
  }

  let lastX = width / 2, lastY = height / 2;
  let tailX = lastX, tailY = lastY; // lagging tail for behind-head effect
  let isInside = true;
  let overInteractive = false;
  const interactiveSel = 'input, textarea, select, button, a, [role="button"], .btn, .article-button, .action-btn, .filter-btn, .modal-close';
  window.addEventListener('pointermove', (e)=>{
    lastX = e.clientX; lastY = e.clientY;
    overInteractive = !!(e.target && (e.target.closest && e.target.closest(interactiveSel)));
    // Do not spawn here; spawning driven by tail in RAF
  }, { passive: true });
  window.addEventListener('mouseenter', ()=>{ isInside = true; });
  window.addEventListener('mouseleave', ()=>{ isInside = false; });

  function step(){
    // Fade the canvas slightly for trail persistence
    // Avoid full-screen flashing: use globalAlpha fade instead of overlaying solid rect
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.08; // trail persistence without flicker
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.globalCompositeOperation = 'lighter';

    // Update tail towards cursor (lag creates behind-head emission)
    const follow = 0.16; // lower => more lag
    const dxHead = lastX - tailX;
    const dyHead = lastY - tailY;
    tailX += dxHead * follow;
    tailY += dyHead * follow;
    const speed = Math.hypot(dxHead, dyHead);

    // Spawn from tail: amount scales with speed but stays subtle; reduce when over interactive
    if (isInside) {
      const base = speed > 14 ? 3 : speed > 6 ? 2 : 1;
      const spawnCount = overInteractive ? 0 : base;
      for (let i = 0; i < spawnCount; i++) spawn(tailX, tailY);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      if (p.life > p.maxLife) { particles.splice(i, 1); continue; }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.985;
      const t = 1 - p.life / p.maxLife;
      const size = p.size * (0.8 + 0.6 * t);
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10 * t + 4;
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // If mouse stopped but inside, spawn gently at tail for a faint idle glow
    if (isInside && !overInteractive && particles.length < maxParticles * 0.6) {
      if (Math.random() < 0.08) spawn(tailX, tailY);
    }

    requestAnimationFrame(step);
  }
  // Initialize with slight transparent fill to avoid flash
  // No initial full-screen fill to avoid any flash on load
  requestAnimationFrame(step);

  // Cleanup on unload
  window.addEventListener('beforeunload', ()=>{
    canvas.remove();
  });
})();


