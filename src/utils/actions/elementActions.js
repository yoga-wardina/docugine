export function patchElement(elements, id, patch) {
  return elements.map((el) => (el.id === id ? { ...el, ...patch } : el));
}

export function patchElementStyle(elements, id, stylePatch) {
  return elements.map((el) =>
    el.id === id ? { ...el, style: { ...(el.style || {}), ...stylePatch } } : el
  );
}

export function deleteElements(elements, ids) {
  const idSet = new Set(ids);
  return elements.filter((el) => !idSet.has(el.id));
}

export function deleteElement(elements, id) {
  return deleteElements(elements, [id]);
}

export function moveElementZ(elements, id, delta) {
  const next = [...elements];
  const idx = next.findIndex((el) => el.id === id);
  if (idx === -1) return elements;
  const newIdx = Math.max(0, Math.min(next.length - 1, idx + delta));
  if (newIdx === idx) return elements;
  const [el] = next.splice(idx, 1);
  next.splice(newIdx, 0, el);
  return next;
}

export function toggleElementHidden(elements, id) {
  return patchElement(elements, id, { hidden: !elements.find((el) => el.id === id)?.hidden });
}

export function toggleBorderSide(elements, id, side, currentSides) {
  return patchElementStyle(elements, id, {
    borderSides: { ...currentSides, [side]: !currentSides[side] },
  });
}
