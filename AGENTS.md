# AGENTS.md

Agent-facing documentation for the **Docugine** codebase. Read this before making changes.

## 1. Project summary

Docugine is a browser-based **A4 document template designer**. It is a single-page React 19 app (bootstrapped with Create React App) that lets a user:

- Visually compose multi-page A4 (210×297 mm) templates by placing elements on a canvas.
- Edit text inline with a rich-text editor (Quill via `react-quill-new`).
- Insert `{{tag}}` placeholders that are merged with a JSON data payload (template-merge workflow, similar to Handlebars/Mustache but very simple).
- Export/import the full document as JSON for reuse, and persist the working document to `localStorage`.

The whole app lives under `src/`; there is no backend, no router, no global state library. State is `useState` in `App.js` and flows down via props.

## 2. Tech stack

| Layer        | Choice                              | Where to look |
| ------------ | ----------------------------------- | ------------- |
| Framework    | React 19 (`react`, `react-dom`)     | `src/index.js` |
| Build / dev  | Create React App 5 (`react-scripts`) | `package.json` scripts |
| Styling      | Tailwind CSS 3 + PostCSS            | `tailwind.config.js`, `postcss.config.js` |
| Icons        | `lucide-react`                      | imported in each component |
| Rich text    | `react-quill-new` + `quill`         | `src/components/DesignCanvas.jsx`, `src/components/EditorToolbar.jsx` |
| Tooltips     | `react-tooltip`                     | `src/components/Toolbar.jsx` |
| Toasts       | `react-toastify` (dependency, not yet used in UI) | `package.json` |
| Tests        | `@testing-library/*`, `react-scripts test` (Jest) | `src/App.test.js`, `src/setupTests.js` |

No TypeScript. JSX files use `.jsx`; plain modules use `.js`. Config files are JSON / CommonJS.

## 3. Directory layout

```
.
├── public/                    # static CRA assets
├── src/
│   ├── index.js               # React root
│   ├── index.css              # Tailwind directives + global CSS
│   ├── App.js                 # Top-level component, owns ALL state
│   ├── App.test.js            # Smoke test
│   ├── setupTests.js          # jest-dom matchers
│   ├── reportWebVitals.js
│   ├── logo.svg
│   ├── components/            # All UI (see §6)
│   ├── lib/                   # Pure helpers, framework-free (see §5)
│   │   ├── document.js        # Document model + factories + I/O
│   │   ├── history.js         # Undo-tree (branches on undo+edit)
│   │   ├── session.js         # localStorage current/history/sessions/settings
│   │   ├── templates.js       # Prebuilt template factories
│   │   ├── colors.js          # Deterministic layer color
│   │   └── useBreakpoint.js   # Responsive breakpoint hook
│   └── config/
│       └── defaults.json      # Initial UI state (panel widths, sample data, history & session tuning, etc.)
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 4. Core domain: the Document model

Defined in `src/lib/document.js`. This is the single source of truth for the data shape.

```ts
type Document = {
  pages: Page[];
};

type Page = {
  page: {
    width: number;   // mm (default 210 = A4)
    height: number;  // mm (default 297)
    unit: 'mm';
    layout: PageLayout;
  };
  elements: Element[];
};

type PageLayout = {
  margins: { top: number; right: number; bottom: number; left: number };
  marginGuideStyle: 'dotted' | /* ... */;
  marginGuideColor: string;   // CSS color
  showMargins: boolean;
  strictMargin: boolean;      // added by normalize, default false
  snapToMargin: boolean;      // added by normalize, default false
};

type Element = {
  id: string;          // crypto.randomUUID() or fallback
  type: 'text' | 'rect' | 'image' | 'line' | 'watermark';
  x: number; y: number; width: number; height: number;  // mm
  content: string;     // text, image URL, or empty for shapes
  style: Record<string, unknown>;   // type-specific, see §5
  hidden?: boolean;    // layers panel
};
```

Key invariants:

- All positions and sizes are in **millimeters**, not pixels. `MM_TO_PX = 96 / 25.4` converts to CSS px for the canvas.
- `Element.id` is unique within the document and used for selection (`selectedIds`), keys, and React lists.
- `Element.content` for `text` may contain `{{tag}}` placeholders. `mergeTags(content, data)` performs substitution; unknown tags become `''`.
- `watermark` is a special image-like element rendered on top of all pages with low opacity.

### Document lifecycle helpers (in `src/lib/document.js`)

| Export | Purpose |
| ------ | ------- |
| `defaultDocument()` | First-run document (sample invoice). |
| `defaultLayout()` | Default page margins + guide settings. |
| `newElement(type, x?, y?)` | Create an element of a given type with sensible defaults. |
| `newHeadingElement(x?, y?)` | A bold 20pt heading text element. |
| `newSignatureTemplate(x?, y?)` | Returns a `[label, line]` pair of elements. |
| `newWatermarkElement(x?, y?)` | A `watermark`-type element. |
| `newId()` | UUID with a non-crypto fallback. |
| `mergeTags(content, data)` | Replace `{{tag}}` occurrences using `data`. |
| `findTags(content)` | Return an array of tag names found in `content`. |
| `exportDocument(doc)` | Pretty-printed JSON string. |
| `importDocument(json)` | Parse + validate + normalize. Accepts either `{pages:[…]}` or a flat `{elements:[…]}` (treated as one page). |

`importDocument` is **lenient**: it fills missing fields with defaults, so older or partial JSON still loads.

## 5. Element types & their `style` keys

| `type`     | `content`            | `style` keys of interest |
| ---------- | -------------------- | ------------------------ |
| `text`     | HTML/Quill HTML or plain text | `fontSize` (pt), `fontWeight`, `color`, `textAlign`, `fontFamily`, `whiteSpace`, plus Quill inline formats (bold, italic, etc.) when edited inline |
| `rect`     | (unused)             | `backgroundColor`, `borderColor`, `borderWidth` (px), `borderStyle`, `borderRadius`, `borderSides` ({top,right,bottom,left}), `opacity`, `zIndex` |
| `image`    | image URL            | `objectFit` ('cover' \| 'contain' \| etc.), `opacity`, `borderRadius`, `border*` |
| `line`     | (unused)             | `lineColor` (rendered as `backgroundColor`), `rotation` (deg) |
| `watermark`| image URL            | `opacity` (default 0.15), `objectFit` |

`src/lib/colors.js → getLayerColor(id)` returns a deterministic HSL color per element id; used for the layer outline while dragging.

## 6. Component map

All components are default-exported React function components. Props flow one way from `App.js`.

| Component | Path | Responsibility | Key props |
| --------- | ---- | -------------- | --------- |
| `App` | `src/App.js` | Owns state, persistence, history, keyboard shortcuts, page routing, resizable panels | — |
| `Toolbar` | `src/components/Toolbar.jsx` | Top ribbon (Home / Insert / View / Format tabs) | all UI state + callbacks |
| `DesignCanvas` | `src/components/DesignCanvas.jsx` | Renders the A4 page, handles selection/drag/resize, embeds Quill for inline text editing | `doc`, `setDoc`, `mode`, `data`, `snapMm`, `zoom`, `editingId` |
| `ElementList` | `src/components/ElementList.jsx` | Left "Layers" panel; click to select, shift-click to multi-select, eye icon to hide | `doc`, `setDoc`, `selectedIds`, `setSelectedIds` |
| `PropertyPanel` | `src/components/PropertyPanel.jsx` | Right-side properties (position, size, color, font, borders, alignment, etc.) for the current selection | `selectedIds`, `doc`, `setDoc`, `editingId`, `quillRef` |
| `PagePanel` | `src/components/PagePanel.jsx` | Right-side page settings (size, margins, watermark) | `doc`, `setDoc`, `selectedIds` |
| `SessionPanel` | `src/components/SessionPanel.jsx` | Right-side history + saved snapshots: undo/redo, save snapshot, list, load, rename, delete | `sessions`, `canUndo`, `canRedo`, callbacks |
| `DataPanel` | `src/components/DataPanel.jsx` | "Merge" mode: JSON editor for the merge-data payload + auto-detected tags | `doc`, `data`, `setData` |
| `JsonPanel` | `src/components/JsonPanel.jsx` | "JSON" mode: view/copy/download/load the document as JSON | `doc`, `setDoc` |
| `EditorToolbar` | `src/components/EditorToolbar.jsx` | Quill helpers (bold/italic/lists/etc.) consumed by the Format tab. Exports `StylingButtons`, `AlignmentButtons`, `ListButtons`, `TextButtons` and a `formatText/insertTagText/...` API | `quillRef` |

The right-side panel content is selected by `mode` in `App.js`:
- `design` → `PropertyPanel` + `PagePanel`
- `merge`  → `DataPanel`
- `json`   → `JsonPanel`

## 7. State & persistence

All state is local to `App.js`:

```
doc, currentPage, selectedIds, mode,
data, snapEnabled, snapPixels, zoom,
editingId, leftWidth, rightWidth, showGuides, showGrid, sessions,
leftOpen, rightOpen
```

Initial values come from `src/config/defaults.json` (the `sampleData` keys are merged with `date: <today>`).

### Responsive layout

`src/lib/useBreakpoint.js` returns one of `mobile` (<640px) / `tablet` (640-1023) / `desktop` (1024-1279) / `wide` (≥1280). The compact modes (`mobile` and `tablet`) collapse the side panels into overlay drawers with a backdrop; toolbar shows hamburger and panel toggle buttons. Desktop/wide keeps the resizable three-column layout. `App.js` derives `isCompact` from this and forces `leftOpen`/`rightOpen` accordingly. The Home and View tabs include a "Fit to screen" button (the `ScanLine` icon) that picks a zoom that fits the page width.

Persistence (`src/lib/session.js`, `src/lib/history.js`):

- `docugine:current` — the active document (replaces the old `docugine:template` key; legacy key is still read on first load).
- `docugine:history` — the serialized undo-tree for the active document.
- `docugine:sessions` — index of saved snapshots: `[{id, name, updatedAt}]`.
- `docugine:session:{id}` — each saved snapshot: `{id, name, updatedAt, doc, history}`.
- `docugine:settings` — reserved for future UI preferences.

Auto-save runs on every `doc` change; an additional `setInterval` re-persists the doc and history tree every `defaults.session.autoSaveIntervalMs` (default 30 s).

Keyboard shortcuts (global, installed in `App.js`):

- `Ctrl/Cmd+Z` — undo (replays history tree up to the parent of the current node).
- `Ctrl/Cmd+Shift+Z` *or* `Ctrl/Cmd+Y` — redo (descends to the most-recent child of the current node).
- `Ctrl/Cmd+S` — save a snapshot of the current document + history tree.
- `Delete` / `Backspace` — delete selected elements (ignored when focus is in `input`/`textarea`/`select`).
- `Escape` — clear selection; also exit text editing (without saving).
- `Enter` on a text element → enters edit mode (handled in `DesignCanvas`).

## 7a. Undo tree

Implemented in `src/lib/history.js`. Every `doc` change is committed through a debounced effect (`defaults.history.commitDebounceMs`, default 250 ms) so a drag is one node, not fifty. The tree supports branches: undo then edit creates a sibling; redo follows the most-recent child. The tree is pruned to `defaults.history.maxNodes` (default 200) by dropping the oldest off-path leaves first, so the current undo path is always preserved. `App.js` exposes a `applyingHistoryRef` flag so state changes from undo/redo don't re-commit.

## 8. Run / build / test

All commands are CRA defaults; nothing is wrapped.

```bash
npm install            # one-time
npm start              # dev server on http://localhost:3000
npm test               # Jest in watch mode (react-scripts test)
npm run build          # production build into ./build
npm run eject          # irreversible, do NOT run unless asked
```

There is no lint script beyond CRA's built-in ESLint (`react-app` config). `npm test` is the closest thing to a CI gate; keep the smoke test in `src/App.test.js` green.

## 9. Conventions & gotchas

- **No new comments unless asked.** Code is currently uncommented; follow that style.
- **JSX in `.jsx`, plain JS in `.js`.** Don't mix.
- **Tailwind brand palette** is defined in `tailwind.config.js` (`brand.accent`, `brand.danger`, etc.). Use these tokens instead of raw hex.
- **Millimeters everywhere.** When adding anything to the canvas, think in mm. Convert with `MM_TO_PX` only at the DOM/CSS boundary (already done in `DesignCanvas.toCssStyle`).
- **Mutations go through `setDoc` / `setPageDoc`.** Don't mutate the `doc` state object directly; use the `prev => …` updater form so React detects changes and so `localStorage` persistence re-runs.
- **`setPageDoc`** is a memoized updater scoped to the current page (`doc.pages[currentPage]`). Prefer it over re-writing the whole document when the change is page-local.
- **Selection state** is an array (`selectedIds`) so multi-select works; some panels (`PropertyPanel`) show a simplified view when length !== 1.
- **Inline text editing** uses a single shared `quillRef` on `App`. Only one element edits at a time; the Format tab appears automatically while `editingId` is set.
- **Templates** are factories in `src/lib/templates.js`. New built-in templates go in the `TEMPLATES` map at the bottom; each value is `{ label, factory }` where `factory()` returns a full `Document`.
- **`localStorage` may be unavailable** (private mode, quota). All reads/writes are wrapped in `try/catch`; don't add code that crashes on storage failure.
- **Pure helpers belong in `src/lib/`**, not inside components. The document model, templates, and color helpers are intentionally framework-free so they can be unit-tested or reused.
- **Imports are absolute-ish**: components import the lib as `'../lib/document'`. Keep that style.

## 10. Common tasks for an agent

- **Add a new element type** (e.g. `circle`):
  1. Add the type to `newElement()` in `src/lib/document.js` with default `content`/`style`.
  2. Add a renderer branch in `DesignCanvas.toCssStyle` and the element body.
  3. Add an "Insert" button in `Toolbar.jsx → InsertTab` calling `onAddElement('circle')`.
  4. Extend `PropertyPanel` to show relevant fields when the selection is of that type.
  5. Update §5 of this file.

- **Add a new built-in template**:
  1. Write a factory in `src/lib/templates.js` returning `baseDoc([…])`.
  2. Register it in the `TEMPLATES` object.
  3. No UI changes required — the toolbar dropdown reads from `TEMPLATES`.

- **Add a new merge tag feature** (e.g. nested lookups): change `mergeTags` and `findTags` in `src/lib/document.js`. Update `DataPanel` only if the UI needs to surface it.

- **Wire a new history/session action**: add it to `src/lib/history.js` (or `session.js`), then expose it through `App.js` (memoized via `useCallback`) and pass it down to `Toolbar` / `SessionPanel`. Remember to gate keyboard shortcuts on `isEditableTarget(e.target)` so typing in inputs/Quill doesn't fire them.

- **Persist additional UI state** (e.g. zoom): keep state in `App.js` and add it to `defaults.json`. Don't write a new localStorage key without a migration story.

- **Touch the canvas rendering** carefully — `DesignCanvas.jsx` is 800+ lines and mixes layout, selection, drag/resize, snap, guides, grid, and Quill. Read the existing helpers (`toCssStyle`, `getElementBounds`, etc.) before adding new ones.

## 11. Known limitations

- No real PDF export (JSON only).
- `react-toastify` is installed but unused; safe to wire in for non-blocking notifications.
- Snap/grid/guides are mm/px approximations; sub-mm precision is not guaranteed.
- Watermarks are global-per-page; multi-watermark pages are stored but the UI manages only the first one.
- Undo/redo: tree is pruned by node count, not by age or size; very large docs may lose older siblings first.
- Sessions live entirely in `localStorage` — clearing browser data wipes both current and snapshots (see `DATA-STRUCTURE.md` for the server-side plan).
- Responsive layout: sub-640px screens are usable but cramped. A4 at default zoom is wider than a phone, so the "Fit to screen" button (`ScanLine` icon, Home and View tabs) is the recommended way to enter edit mode on mobile.
