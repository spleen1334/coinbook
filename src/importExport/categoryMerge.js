export function mergeImportedCategories(currentCategories, importedCategories, swatches) {
  const categories = [...currentCategories];
  const catByName = {};
  const catById = {};
  const usedIds = new Set();

  categories.forEach((c) => {
    catByName[c.name.toLowerCase()] = c.id;
    catById[c.id] = c.id;
    usedIds.add(c.id);
  });

  const importTick = Date.now();
  importedCategories.forEach((c, i) => {
    const name = (c.name || '').trim();
    if (!name) return;

    const sourceId = c.id || '';
    const nameKey = name.toLowerCase();
    if (catByName[nameKey]) {
      if (sourceId) catById[sourceId] = catByName[nameKey];
      return;
    }

    const id = sourceId && !usedIds.has(sourceId) ? sourceId : 'custom_' + importTick + '_' + i;
    usedIds.add(id);
    catByName[nameKey] = id;
    if (sourceId) catById[sourceId] = id;
    catById[id] = id;
    categories.push({
      id,
      name,
      color: c.color || swatches[(categories.length - currentCategories.length) % swatches.length]
    });
  });

  return { categories, catByName, catById };
}
