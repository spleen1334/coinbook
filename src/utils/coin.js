// djb2 string hash: cheap, deterministic, and well-distributed enough that
// similar category names (e.g. "Food" vs "Food2") don't land on similar hues.
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // unsigned, so it's safe to use as a positive index below
}

// Derives a stable color from a category name: same name always produces the
// same color, regardless of array order, import order, or which device it
// was created on. The golden-angle multiplier (as in defaultCatColor) keeps
// hues from adjacent hash values spread far apart on the color wheel, so
// categories still read as visually distinct even when hashed independently.
export function hashCatColor(name) {
  const hue = Math.round((hashString(String(name)) * 137.508) % 360);
  return 'hsl(' + hue + ', 32%, 34%)';
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
