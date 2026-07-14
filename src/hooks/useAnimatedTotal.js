export function createTotalAnimator({ getValue, setValue }) {
  let raf = null;
  let fallback = null;

  function cancel() {
    if (raf) cancelAnimationFrame(raf);
    if (fallback) clearTimeout(fallback);
    raf = null;
    fallback = null;
  }

  function animate(target, fromZero) {
    cancel();
    const startVal = fromZero ? 0 : getValue() || 0;
    const startTime = Date.now();
    const duration = 650;
    const step = () => {
      const now = Date.now();
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = startVal + (target - startVal) * eased;
      setValue(t >= 1 ? target : val);
      raf = t < 1 ? requestAnimationFrame(step) : null;
    };
    raf = requestAnimationFrame(step);
    fallback = setTimeout(() => {
      if (Math.abs((getValue() || 0) - target) > 1e-9) setValue(target);
    }, duration + 150);
  }

  return { animate, cancel };
}
