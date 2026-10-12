(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)'), seen = new WeakSet(), animations = new Set();
  const selector = '.section-heading > *, .menu-feature > figure, .menu-feature-copy > *, .order-steps .wrap > div, .order-steps li, .about-grid > figure, .real-food-gallery > figure, .about-grid > div:not(.real-food-gallery) > *, .rating-panel, .quotes > *, .location-grid > div:first-child > *, .address-panel, .final-cta .wrap > div > *, .final-cta .wrap > .button, .footer-top > *';
  const elements = [...document.querySelectorAll(selector)];
  function show(element, delay = 0) {
    element.classList.remove('reveal-pending');
    if (seen.has(element)) return;
    seen.add(element);
    if (reduce.matches || element.contains(document.activeElement) || !element.animate) return;
    const photo = element.matches('figure,.rating-panel,.address-panel');
    const animation = element.animate([
      { opacity:0, transform:`translateY(${photo ? 26 : 18}px) scale(${photo ? .97 : 1})` },
      { opacity:1, transform:'translateY(0) scale(1)' }
    ], { duration:photo ? 1050 : 850, delay, easing:'cubic-bezier(.23,1,.32,1)', fill:'backwards' });
    animations.add(animation);
    animation.finished.then(()=>animations.delete(animation)).catch(()=>animations.delete(animation));
  }
  const observer = new IntersectionObserver(entries => {
    entries.filter(e=>e.isIntersecting).forEach((entry,i)=>{
      observer.unobserve(entry.target); show(entry.target,Math.min(i*70,210));
    });
  }, {threshold:0});
  elements.forEach(el=>{
    const rect=el.getBoundingClientRect();
    if(rect.top<innerHeight && rect.bottom>0){seen.add(el);return;}
    if(!reduce.matches)el.classList.add('reveal-pending');
    observer.observe(el);
  });
  if(!location.hash && scrollY<100){
    [...document.querySelector('.hero-copy').children].forEach((el,i)=>show(el,Math.min(i*65,260)));
    show(document.querySelector('.hero-food'),100);
  }
  function revealAll(){elements.forEach(el=>el.classList.remove('reveal-pending'));animations.forEach(a=>a.cancel());}
  reduce.addEventListener('change',()=>{if(reduce.matches)revealAll()});
  document.addEventListener('focusin',e=>{elements.forEach(el=>{if(el.contains(e.target)){el.classList.remove('reveal-pending');seen.add(el);observer.unobserve(el)}});animations.forEach(a=>{if(a.effect.target.contains(e.target))a.cancel()})});
  const header=document.querySelector('header');let queued=false;
  function update(){header.classList.toggle('scrolled',scrollY>20);queued=false}
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});update();
})();
