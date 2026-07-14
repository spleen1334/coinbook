// djb2 string hash: cheap, deterministic, and well-distributed enough that
// similar category names (e.g. "Food" vs "Food2") don't land on similar hues.
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // unsigned, so it's safe to use as a positive index below
}

const SATURATION_STEPS = [42, 47, 52, 57]; // vivid enough to read as clearly different hues
const LIGHTNESS_STEPS = [30, 34, 38, 42, 46]; // dark enough that white lettering stays readable

// Two names that happen to hash to a similar hue would otherwise look like
// the "same" color if saturation and lightness were fixed (this was the bug:
// every category was 32% saturation / 34% lightness, so only hue varied, and
// nearby hues at identical brightness read as near-identical). Salting the
// hash input per channel (name, name+'|s', name+'|l') draws three
// effectively independent values from the same hash function, so two names
// with a close hue will still usually differ in vividness or brightness.
export function hashCatColor(name) {
  const key = String(name);
  // Plain modulo, not a golden-angle multiply: that trick evenly spaces
  // *sequential* integers (0, 1, 2, 3, ...) around the circle, but applied to
  // arbitrary hash values it clusters badly — verified empirically against
  // the app's default category list, where it packed most names into a
  // ~40-degree blue/purple arc. A well-mixed hash mod 360 spreads far better.
  const hue = hashString(key) % 360;
  const saturation = SATURATION_STEPS[hashString(key + '|s') % SATURATION_STEPS.length];
  const lightness = LIGHTNESS_STEPS[hashString(key + '|l') % LIGHTNESS_STEPS.length];
  return 'hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)';
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
