/* The unhurried scroll, on desktop only: phones keep their native touch scrolling. */
(function () {
  if (!window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var lenis = new window.Lenis({ lerp: 0.07, wheelMultiplier: 0.85, smoothWheel: true, syncTouch: false, anchors: { offset: -84 } });
  window.irisLenis = lenis;
  function frame(t) { lenis.raf(t); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
})();
