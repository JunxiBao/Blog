(function(){
  // 自定义光标脱尾动画效果
  const isFinePointer = matchMedia('(pointer:fine)').matches;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isFinePointer || prefersReduced) return;

  // 创建光标容器
  const cursorContainer = document.createElement('div');
  cursorContainer.className = 'cursor-trail';
  document.body.appendChild(cursorContainer);

  // 创建主光标
  const cursor = document.createElement('div');
  cursor.className = 'cursor-main';
  cursorContainer.appendChild(cursor);

  // 鼠标位置跟踪
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let isHovering = false;
  let isClicking = false;

  // 鼠标移动事件 — position is set directly here, no RAF needed
  document.addEventListener('pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // 事件触发时立即更新，最大程度降低延迟感
    cursorX = mouseX;
    cursorY = mouseY;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
  });

  // 鼠标进入页面
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });

  // 鼠标离开页面
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });

  // 悬停效果
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    if (target.matches('a, button, .btn, .article-button, .action-btn, .filter-btn, [role="button"], .modal-close, input, textarea, [contenteditable="true"]')) {
      isHovering = true;
      cursor.classList.add('cursor-hover');
      
      // 文本输入框特殊处理
      if (target.matches('input, textarea, [contenteditable="true"]')) {
        cursor.classList.add('cursor-text');
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target;
    if (target.matches('a, button, .btn, .article-button, .action-btn, .filter-btn, [role="button"], .modal-close, input, textarea, [contenteditable="true"]')) {
      isHovering = false;
      cursor.classList.remove('cursor-hover', 'cursor-text');
    }
  });

  // 点击效果
  document.addEventListener('mousedown', (e) => {
    isClicking = true;
    cursor.classList.add('cursor-click');
    
    // 创建点击波纹效果
    createClickRipple(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', () => {
    isClicking = false;
    cursor.classList.remove('cursor-click');
  });

  // 创建点击波纹
  function createClickRipple(x, y) {
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
    cursorContainer.appendChild(ripple);
    
    requestAnimationFrame(() => {
      ripple.style.transform = 'translate3d(0,0,0) scale(20)';
      ripple.style.opacity = '0';
    });
    
    setTimeout(() => ripple.remove(), 600);
  }

  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    cursorContainer.remove();
  });
})();


