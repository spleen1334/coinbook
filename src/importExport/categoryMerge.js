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
  importedCategories.forEach((c, i) => {
    const name = (c.name || '').trim();
    if (!name) return;

    const sourceId = c.id || '';
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
      color: c.color || swatches[(categories.length - currentCategories.length) % swatches.length]
    });
  });

  return { categories, catByName, catById };
}
