import { newId } from './document';

export const HISTORY_STORAGE_KEY = 'docugine:history';

function shallowEqualDoc(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function makeNode(state, parentId, label) {
  return {
    id: newId(),
    parentId,
    children: [],
    label: label || 'Edit',
    timestamp: Date.now(),
    state,
  };
}

function countNodes(node) {
  let n = 1;
  for (const c of node.children) n += countNodes(c);
  return n;
}

function collectLeafIds(node, acc = []) {
  if (!node.children.length) {
    acc.push(node.id);
    return acc;
  }
  for (const c of node.children) collectLeafIds(c, acc);
  return acc;
}

function findPath(node, id, trail = []) {
  if (node.id === id) return [...trail, node];
  for (const c of node.children) {
    const found = findPath(c, id, [...trail, node]);
    if (found) return found;
  }
  return null;
}

function pruneTree(root, maxNodes) {
  if (countNodes(root) <= maxNodes) return;
  const path = findPath(root, root._currentId) || [root];
  const onPath = new Set(path.map((n) => n.id));
  const leaves = collectLeafIds(root);
  const offPathLeaves = leaves.filter((id) => !onPath.has(id));
  offPathLeaves.sort((a, b) => {
    const na = findPath(root, a);
    const nb = findPath(root, b);
    const ta = na ? na[na.length - 1].timestamp : 0;
    const tb = nb ? nb[nb.length - 1].timestamp : 0;
    return ta - tb;
  });
  while (countNodes(root) > maxNodes && offPathLeaves.length) {
    const victimId = offPathLeaves.shift();
    const victimPath = findPath(root, victimId);
    if (!victimPath || victimPath.length < 2) continue;
    const parent = victimPath[victimPath.length - 2];
    const victim = victimPath[victimPath.length - 1];
    parent.children = parent.children.filter((c) => c.id !== victim.id);
  }
}

export function createHistory(initialState, options = {}) {
  const maxNodes = options.maxNodes ?? 200;
  let root = makeNode(initialState, null, 'Initial');
  let currentId = root.id;

  function getCurrent() {
    const path = findPath(root, currentId) || [root];
    return path[path.length - 1];
  }

  return {
    getRoot() {
      return root;
    },

    getCurrent,

    getCurrentState() {
      return getCurrent().state;
    },

    canUndo() {
      return getCurrent().parentId !== null;
    },

    canRedo() {
      return getCurrent().children.length > 0;
    },

    commit(state, label) {
      if (shallowEqualDoc(state, getCurrent().state)) return null;
      const parent = getCurrent();
      const node = makeNode(state, parent.id, label || 'Edit');
      parent.children.push(node);
      currentId = node.id;
      pruneTree(root, maxNodes);
      return node;
    },

    undo() {
      const current = getCurrent();
      if (!current.parentId) return null;
      const path = findPath(root, current.parentId);
      currentId = path[path.length - 1].id;
      return getCurrent().state;
    },

    redo() {
      const current = getCurrent();
      if (!current.children.length) return null;
      const next = current.children[current.children.length - 1];
      currentId = next.id;
      return getCurrent().state;
    },

    goTo(id) {
      if (!findPath(root, id)) return null;
      currentId = id;
      return getCurrent().state;
    },

    getPath() {
      return findPath(root, currentId) || [root];
    },

    size() {
      return countNodes(root);
    },

    clear(state) {
      const fresh = makeNode(state || getCurrent().state, null, 'Reset');
      root = fresh;
      currentId = root.id;
    },

    serialize() {
      return {
        __history: true,
        version: 1,
        root,
        currentId,
      };
    },
  };
}

export function restoreHistory(serialized, options = {}) {
  if (!serialized || !serialized.__history || !serialized.root) {
    return null;
  }
  const h = createHistory(serialized.root.state, options);
  h.clear(serialized.root.state);
  h.getRoot().id = serialized.root.id;
  h.getRoot().parentId = serialized.root.parentId;
  h.getRoot().children = serialized.root.children || [];
  h.getRoot().label = serialized.root.label;
  h.getRoot().timestamp = serialized.root.timestamp;
  h.getRoot().state = serialized.root.state;
  if (serialized.currentId && findPath(h.getRoot(), serialized.currentId)) {
    h.goTo(serialized.currentId);
  }
  return h;
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.serialize()));
  } catch {
  }
}

export function loadHistory(initialState, options = {}) {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return createHistory(initialState, options);
    const parsed = JSON.parse(raw);
    const restored = restoreHistory(parsed, options);
    return restored || createHistory(initialState, options);
  } catch {
    return createHistory(initialState, options);
  }
}
