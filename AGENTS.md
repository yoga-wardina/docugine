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
│   ├── utils/                 # Pure helpers, framework-free (see §5)
│   │   ├── document.js        # Document model + factories + I/O
│   │   ├── history.js         # Undo-tree (branches on undo+edit)
│   │   ├── session.js         # localStorage current/history/sessions/settings
│   │   ├── templates.js       # Prebuilt template factories
│   │   ├── colors.js          # Deterministic layer color
│   │   ├── useBreakpoint.js   # Responsive breakpoint hook
│   │   ├── useDevice.js       # Touch-only device detection
│   │   └── actions/           # Document mutations, isolated from the UI layer
│   │       ├── elementActions.js     # Pure element-level mutations (patch, delete, moveZ, …)
│   │       ├── pageActions.js        # Pure page-level mutations (layout, header, footer, watermark, add element)
│   │       ├── docActions.js         # Pure doc-level mutations (append/remove page, replace doc, add watermark to all pages)
│   │       └── useDocumentActions.js # Hook that wires the action helpers to setDoc/setPageDoc/setAllPagesDoc
│   └── config/
│       └── defaults.json      # Initial UI state (panel widths, sample data, history & session tuning, etc.)
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 4. Core domain: the Document model

Defined in `src/utils/document.js`. This is the single source of truth for the data shape.

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
    header: PageBand; // page header (see §4a)
    footer: PageBand; // page footer (see §4a)
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

type PageBand = {
  enabled: boolean;
  height: number;   // mm
  content: string;  // plain text shown in the band
  style: Record<string, unknown>;
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
- `page.header` and `page.footer` are **page-level bands** (not elements). When enabled, they reserve `height` mm at the top/bottom of the page; `PageTab` clamps the top/bottom margin to be ≥ the band height, and `DesignCanvas` excludes the band area from the strict-margin content region (same behavior as the existing strict-margin clamp).
- **Page-level settings are document-wide.** Layout, header, footer, and watermark are shared across all pages of a document: changes from the *Page* tab (or the Insert → Watermark button) are applied to every page through `setAllPagesDoc`, and a new page created via *Add page* inherits the current page's layout, header, footer, and watermark. The remaining elements (text, rect, image, line) stay per-page.

### Document lifecycle helpers (in `src/utils/document.js`)

| Export | Purpose |
| ------ | ------- |
| `defaultDocument()` | First-run document (sample invoice). |
| `defaultLayout()` | Default page margins + guide settings. |
| `defaultHeader()` | Default page header band (`enabled:false, height:12, content:'', style:{}`). |
| `defaultFooter()` | Default page footer band (same shape as header). |
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

### Document mutation helpers (in `src/utils/actions/`)

The single-page app keeps all document-mutating logic out of the UI layer. There are three layers of pure functions plus one React hook. Each function takes the current state (or relevant slice) and returns a new state — no React, no side effects.

| File | Layer | Exports |
| ---- | ----- | ------- |
| `src/utils/actions/elementActions.js` | element | `patchElement`, `patchElementStyle`, `deleteElement`, `deleteElements`, `moveElementZ`, `toggleElementHidden`, `toggleBorderSide` |
| `src/utils/actions/pageActions.js`    | page    | `addElementToPage`, `addElementsToPage`, `nextInsertOffset`, `patchLayout`, `patchMargins`, `patchHeader`, `patchFooter`, `removeWatermarkFromPage`, `patchWatermarkOnPage`, `patchWatermarkStyleOnPage` |
| `src/utils/actions/docActions.js`     | doc     | `appendPage`, `removePageAt`, `replaceDoc`, `addWatermarkToAllPages` |
| `src/utils/actions/useDocumentActions.js` | hook | `useDocumentActions({ setDoc, setPageDoc, setAllPagesDoc, currentPage, pageDoc, setSelectedIds, setMode, setCurrentPage, setZoom, historyRef, applyingHistoryRef, bumpHistory, defaults })` → returns the `actions` object consumed by `App.js`, `Toolbar`, `PageTab`, `PropertyPanel`, and `ElementList` |

The hook is the only place that touches React state. It memoizes every callback with `useCallback` and wraps the pure helpers in `setDoc` / `setPageDoc` / `setAllPagesDoc` updaters. Panels (PageTab, PropertyPanel, ElementList) receive the `actions` object as a prop and call `actions.foo(...)` instead of building their own `setDoc((prev) => ...)` updaters.

## 5. Element types & their `style` keys

| `type`     | `content`            | `style` keys of interest |
| ---------- | -------------------- | ------------------------ |
| `text`     | HTML/Quill HTML or plain text | `fontSize` (pt), `fontWeight`, `color`, `textAlign`, `fontFamily`, `whiteSpace`, plus Quill inline formats (bold, italic, etc.) when edited inline |
| `rect`     | (unused)             | `backgroundColor`, `borderColor`, `borderWidth` (px), `borderStyle`, `borderRadius`, `borderSides` ({top,right,bottom,left}), `opacity`, `zIndex` |
| `image`    | image URL            | `objectFit` ('cover' \| 'contain' \| etc.), `opacity`, `borderRadius`, `border*` |
| `line`     | (unused)             | `lineColor` (rendered as `backgroundColor`), `rotation` (deg) |
| `watermark`| image URL            | `opacity` (default 0.15), `objectFit` |

`src/utils/colors.js → getLayerColor(id)` returns a deterministic HSL color per element id; used for the layer outline while dragging.

## 6. Component map

All components are default-exported React function components. Props flow one way from `App.js`.

| Component | Path | Responsibility | Key props |
| --------- | ---- | -------------- | --------- |
| `App` | `src/App.js` | Owns state, persistence, history, keyboard shortcuts, page routing, resizable panels | — |
| `Toolbar` | `src/components/Toolbar.jsx` | Top ribbon (Home / Insert / View / Format tabs) | all UI state + callbacks |
| `DesignCanvas` | `src/components/DesignCanvas.jsx` | Renders the A4 page, handles selection/drag/resize, embeds Quill for inline text editing | `doc`, `setDoc`, `mode`, `data`, `snapMm`, `zoom`, `editingId` |
| `ElementList` | `src/components/ElementList.jsx` | Left "Layers" panel; click to select, shift-click to multi-select, eye icon to hide | `doc`, `setDoc`, `selectedIds`, `setSelectedIds` |
| `PropertyPanel` | `src/components/PropertyPanel.jsx` | Right-side properties (position, size, color, font, borders, alignment, etc.) for the current selection | `selectedIds`, `doc`, `setDoc`, `editingId`, `quillRef` |
| `SessionPanel` | `src/components/SessionPanel.jsx` | Right-side history + saved snapshots: undo/redo, save snapshot, list, load, rename, delete | `sessions`, `canUndo`, `canRedo`, callbacks |
| `PageTab` | `src/components/PageTab.jsx` | Toolbar "Page" tab content: margins, margin-guide style/color/show, snap-to-margin, strict-margin, watermark URL/opacity/fit | `doc`, `setDoc`, `setSelectedIds`, `onAddWatermark` |
| `DeviceWarningDialog` | `src/components/DeviceWarningDialog.jsx` | Touch-device warning modal: "for best experience use mouse & keyboard", I-understand checkbox + Continue button; dismissal persisted to `localStorage` | `open`, `onDismiss`, `title`, `message` |
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

`src/utils/useBreakpoint.js` returns one of `mobile` (<640px) / `tablet` (640-1023) / `desktop` (1024-1279) / `wide` (≥1280).

| Breakpoint | Layout |
| ---------- | ------ |
| `mobile`   | Canvas only. Side panels are hidden entirely. The "Fit to screen" button on Home/View is the recommended way to view a page. |
| `tablet`   | Canvas only. Side panels are hidden entirely (use `desktop` or `wide` for the full editor). |
| `desktop` / `wide` | Resizable three-column layout: Layers (left) ‖ Canvas ‖ Properties (right). |

`App.js` derives `isCompact` (`mobile` or `tablet`) and gates the side panels and resizers on `!isCompact`. Below the desktop breakpoint the layout is canvas-only with the full toolbar still available. The Home and View tabs include a "Fit to screen" button (the `ScanLine` icon) that picks a zoom that fits the page width.

Persistence (`src/utils/session.js`, `src/utils/history.js`):

- `docugine:current` — the active document (replaces the old `docugine:template` key; legacy key is still read on first load).
- `docugine:history` — the serialized undo-tree for the active document.
- `docugine:sessions` — index of saved snapshots: `[{id, name, updatedAt}]`.
- `docugine:session:{id}` — each saved snapshot: `{id, name, updatedAt, doc, history}`.
- `docugine:settings` — reserved for future UI preferences.
- `docugine:device-warning-dismissed` — `"1"` once the user has acknowledged the touch-device warning dialog.

Auto-save runs on every `doc` change; an additional `setInterval` re-persists the doc and history tree every `defaults.session.autoSaveIntervalMs` (default 30 s).

Keyboard shortcuts (global, installed in `App.js`):

- `Ctrl/Cmd+Z` — undo (replays history tree up to the parent of the current node).
- `Ctrl/Cmd+Shift+Z` *or* `Ctrl/Cmd+Y` — redo (descends to the most-recent child of the current node).
- `Ctrl/Cmd+S` — save a snapshot of the current document + history tree.
- `Delete` / `Backspace` — delete selected elements (ignored when focus is in `input`/`textarea`/`select`).
- `Escape` — clear selection; also exit text editing (without saving).
- `Enter` on a text element → enters edit mode (handled in `DesignCanvas`).

## 7a. Undo tree

Implemented in `src/utils/history.js`. Every `doc` change is committed through a debounced effect (`defaults.history.commitDebounceMs`, default 250 ms) so a drag is one node, not fifty. The tree supports branches: undo then edit creates a sibling; redo follows the most-recent child. The tree is pruned to `defaults.history.maxNodes` (default 200) by dropping the oldest off-path leaves first, so the current undo path is always preserved. `App.js` exposes a `applyingHistoryRef` flag so state changes from undo/redo don't re-commit.

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
- **Templates** are factories in `src/utils/templates.js`. New built-in templates go in the `TEMPLATES` map at the bottom; each value is `{ label, factory }` where `factory()` returns a full `Document`.
- **`localStorage` may be unavailable** (private mode, quota). All reads/writes are wrapped in `try/catch`; don't add code that crashes on storage failure.
- **Pure helpers belong in `src/utils/`**, not inside components. The document model, templates, and color helpers are intentionally framework-free so they can be unit-tested or reused.
- **Imports are absolute-ish**: components import the utils as `'../utils/document'`. Keep that style.

## 10. Common tasks for an agent

- **Add a new element type** (e.g. `circle`):
  1. Add the type to `newElement()` in `src/utils/document.js` with default `content`/`style`.
  2. Add a renderer branch in `DesignCanvas.toCssStyle` and the element body.
  3. Add an "Insert" button in `Toolbar.jsx → InsertTab` calling `onAddElement('circle')`.
  4. Extend `PropertyPanel` to show relevant fields when the selection is of that type.
  5. Update §5 of this file.

- **Add a new built-in template**:
  1. **Code-defined** (the existing pattern): write a factory in `src/utils/templates.js` returning `baseDoc([…])` and register it in the `TEMPLATES` object.
  2. **JSON-defined** (recommended for long / hand-edited templates): drop a `Document`-shaped JSON file in `src/config/templates/` (the file's basename becomes the template key, and the label is auto-derived from the filename — `offer-letter.json` → "Offer Letter"). Add one import + one `TEMPLATES[…]` line at the bottom of `src/utils/templates.js`. The factory is `makeJsonTemplate(imported)` and runs the JSON through `importDocument()` so missing `header` / `footer` / `layout` fields are filled in.
  3. Either way, no UI changes are required — the toolbar's `Templates` group reads from `TEMPLATES` and renders a thumbnail preview for each entry via `TemplatePreviewButton`.

- **Add a new merge tag feature** (e.g. nested lookups): change `mergeTags` and `findTags` in `src/utils/document.js`. Update `DataPanel` only if the UI needs to surface it.

- **Wire a new history/session action**: add it to `src/utils/history.js` (or `session.js`), then expose it through `App.js` (memoized via `useCallback`) and pass it down to `Toolbar` / `SessionPanel`. Remember to gate keyboard shortcuts on `isEditableTarget(e.target)` so typing in inputs/Quill doesn't fire them.

- **Persist additional UI state** (e.g. zoom): keep state in `App.js` and add it to `defaults.json`. Don't write a new localStorage key without a migration story.

- **Touch the canvas rendering** carefully — `DesignCanvas.jsx` is 800+ lines and mixes layout, selection, drag/resize, snap, guides, grid, and Quill. Read the existing helpers (`toCssStyle`, `getElementBounds`, etc.) before adding new ones.

## 11. Known limitations

- No real PDF export (JSON only).
- `react-toastify` is installed but unused; safe to wire in for non-blocking notifications.
- Snap/grid/guides are mm/px approximations; sub-mm precision is not guaranteed.
- Watermarks are global-per-page; multi-watermark pages are stored but the UI manages only the first one.
- Undo/redo: tree is pruned by node count, not by age or size; very large docs may lose older siblings first.
- Sessions live entirely in `localStorage` — clearing browser data wipes both current and snapshots (see `DATA-STRUCTURE.md` for the server-side plan).
- Responsive layout: sub-1024px screens are usable but cramped. A4 at default zoom is wider than a phone, so the "Fit to screen" button (`ScanLine` icon, Home and View tabs) is the recommended way to enter edit mode on mobile.
