export function defaultCatColor(i) {
  return 'hsl(' + Math.round((i * 137.508) % 360) + ', 32%, 34%)';
}

// Layered radial-gradient overlay that gives any flat category color the
// same coin-like shading (light highlight top-left, shadow bottom-right)
// used throughout the ledger, category picker, and chart legend.
export function coinFace(color) {
  return (
    'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%), ' +
    'radial-gradient(circle at 72% 84%, rgba(0,0,0,0.35), rgba(0,0,0,0) 55%), ' +
    color
  );
}
