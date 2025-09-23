(function(){
  // JS no longer draws custom DOM cursor; CSS handles cursor visuals.
  // We keep a minimal enhancement: add ripple on click for subtle feedback on fine pointers.
  const isFinePointer = matchMedia('(pointer:fine)').matches;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isFinePointer || prefersReduced) return;

  const body = document.body;

  window.addEventListener('pointerdown', (e)=>{
    spawnRipple(e.clientX, e.clientY);
  }, { passive: true });

  function spawnRipple(x, y){
    const el = document.createElement('span');
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = '2px';
    el.style.height = '2px';
    el.style.marginLeft = '-1px';
    el.style.marginTop = '-1px';
    el.style.borderRadius = '50%';
    el.style.background = 'rgba(0,255,65,.28)';
    el.style.boxShadow = '0 0 24px rgba(0,255,65,.35)';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.transform = 'translate3d(0,0,0) scale(1)';
    el.style.transition = 'transform .45s ease-out, opacity .45s ease-out';
    body.appendChild(el);
    requestAnimationFrame(()=>{
      el.style.transform = 'translate3d(0,0,0) scale(14)';
      el.style.opacity = '0';
    });
    setTimeout(()=> el.remove(), 500);
  }
})();


