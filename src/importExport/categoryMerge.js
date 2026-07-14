import { normalizeColor } from '../utils/validate.js';

const MAX_NAME_LENGTH = 100;
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function safeSourceId(rawId) {
  const id = typeof rawId === 'string' ? rawId.trim() : '';
  return SAFE_ID_RE.test(id) ? id : '';
}

export function mergeImportedCategories(currentCategories, importedCategories, swatches) {
  const categories = [...currentCategories];
  const catByName = new Map();
  const catById = new Map();
  const usedIds = new Set();

  categories.forEach((c) => {
    catByName.set(c.name.toLowerCase(), c.id);
    catById.set(c.id, c.id);
    usedIds.add(c.id);
  });

  const importTick = Date.now();
  importedCategories.forEach((raw, i) => {
    const c = raw && typeof raw === 'object' ? raw : {};
    const name = (typeof c.name === 'string' ? c.name : '').trim().slice(0, MAX_NAME_LENGTH);
    if (!name) return;

    const sourceId = safeSourceId(c.id);
    const nameKey = name.toLowerCase();
    if (catByName.has(nameKey)) {
      if (sourceId) catById.set(sourceId, catByName.get(nameKey));
      return;
    }

    const id = sourceId && !usedIds.has(sourceId) ? sourceId : 'custom_' + importTick + '_' + i;
    usedIds.add(id);
    catByName.set(nameKey, id);
    if (sourceId) catById.set(sourceId, id);
    catById.set(id, id);
    categories.push({
      id,
      name,
      color: normalizeColor(c.color, swatches[(categories.length - currentCategories.length) % swatches.length])
    });
  });

  return { categories, catByName, catById };
}
