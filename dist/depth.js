/* Gentle spring perspective for CTAs and the opening pizza. */
(() => {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll('.button, button, .mobile-bar a')]
    .map(element => ({ surface: element, element, pizza: false }));
  document.querySelectorAll('.hero-food img, .menu-feature img, .editorial-photo img').forEach(image => targets.push({ surface: image.closest('figure'), element: image, pizza: true }));
  targets.forEach(({ surface, element, pizza }) => {
    const baseRotation = pizza && surface.matches('.editorial-photo') ? -8 : -4;
    const state = { x: 0, y: 0, lift: 0, vx: 0, vy: 0, vl: 0, tx: 0, ty: 0, tl: 0 };
    let frame = 0, previous = 0;
    element.classList.add('depth-interactive');
    function reset() {
      cancelAnimationFrame(frame); frame = previous = 0;
      Object.keys(state).forEach(key => state[key] = 0);
      element.style.removeProperty('transform');
      if (pizza) element.style.removeProperty('filter');
      element.classList.remove('depth-tracking');
    }
    function step(now) {
      frame = 0;
      if (!fine.matches || reduced.matches || document.hidden) { reset(); return; }
      const dt = previous ? Math.min((now - previous) / 1000, .032) : .016;
      previous = now;
      for (const [value, velocity, target] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['lift', 'vl', 'tl']]) {
        state[velocity] += ((state[target] - state[value]) * 100 - state[velocity] * 10) * dt;
        state[value] += state[velocity] * dt;
      }
      if (pizza) {
        // Keep the silhouette full: a little perspective, mostly depth and lighting.
        // Shadow moves opposite the pointer to suggest a fixed light source.
        element.style.transform = `translate3d(${state.x * 4}px,${state.y * 2 - state.lift * 5}px,${state.lift * 22}px) rotateX(${-state.y * 1.8}deg) rotateY(${state.x * 2.8}deg) rotateZ(${baseRotation}deg)`;
        element.style.filter = `drop-shadow(${-state.x * 10}px ${25 + state.lift * 8 - state.y * 4}px ${15 + state.lift * 3}px rgba(52,19,5,.34)) drop-shadow(0 4px 3px rgba(52,19,5,.14))`;
      } else {
        element.style.transform = `perspective(600px) translate3d(${state.x * 2}px,${state.y * 2 - state.lift * 2}px,0) rotateX(${-state.y * 4}deg) rotateY(${state.x * 4}deg) scale(${1 + state.lift * .015})`;
      }
      const unsettled = Math.abs(state.x - state.tx) + Math.abs(state.y - state.ty) + Math.abs(state.lift - state.tl) + Math.abs(state.vx) + Math.abs(state.vy) + Math.abs(state.vl) > .025;
      if (unsettled) frame = requestAnimationFrame(step);
      else { previous = 0; if (!state.tl) reset(); }
    }
    function start() {
      element.classList.add('depth-tracking');
      if (!frame) frame = requestAnimationFrame(step);
    }
    surface.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !fine.matches || reduced.matches) return;
      // Measure a stable layout box, rather than the animated bounding box.
      const rect = surface.getBoundingClientRect();
      state.tx = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      state.ty = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      state.tl = 1; start();
    }, { passive: true });
    surface.addEventListener('pointerleave', () => { state.tx = state.ty = state.tl = 0; start(); });
    // Release inline transforms so existing press feedback stays immediate.
    surface.addEventListener('pointerdown', reset);
    element.addEventListener('focus', reset);
    reduced.addEventListener('change', reset); fine.addEventListener('change', reset);
    window.addEventListener('blur', reset); document.addEventListener('visibilitychange', reset);
  });
})();
