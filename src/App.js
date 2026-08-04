import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { defaultDocument, importDocument, MM_TO_PX } from './utils/document';
import { TEMPLATES } from './utils/templates';
import {
  createHistory,
  loadHistory,
  saveHistory,
  restoreHistory,
} from './utils/history';
import {
  saveCurrent,
  loadCurrent,
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
  renameSession,
  defaultSessionName,
  saveMergeData,
  loadMergeData,
} from './utils/session';
import { useBreakpoint } from './utils/useBreakpoint';
import { useNeedsPointerWarning } from './utils/useDevice';
import { useDocumentActions } from './utils/actions/useDocumentActions';
import { deleteElements } from './utils/actions/elementActions';
import DesignCanvas from './components/DesignCanvas';
import ElementList from './components/ElementList';
import PropertyPanel from './components/PropertyPanel';
import DataPanel from './components/DataPanel';
import JsonPanel from './components/JsonPanel';
import SessionPanel from './components/SessionPanel';
import DeviceWarningDialog from './components/DeviceWarningDialog';
import Toolbar from './components/Toolbar';
import defaults from './config/defaults.json';

const LEGACY_STORAGE_KEY = 'docugine:template';

function loadInitialDoc() {
  const current = loadCurrent();
  if (current) {
    try {
      return importDocument(JSON.stringify(current));
    } catch {
    }
  }
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return importDocument(legacy);
  } catch {
  }
  return defaultDocument();
}

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

function App() {
  const [doc, setDoc] = useState(loadInitialDoc);
  const [currentPage, setCurrentPage] = useState(defaults.currentPage);
  const [selectedIds, setSelectedIds] = useState(defaults.selectedIds);
  const [mode, setMode] = useState(defaults.mode);
  const [data, setData] = useState(() => {
    const saved = loadMergeData();
    if (saved && typeof saved === 'object') {
      return {
        ...defaults.sampleData,
        ...saved,
        date: saved.date || new Date().toISOString().split('T')[0],
      };
    }
    return {
      ...defaults.sampleData,
      date: new Date().toISOString().split('T')[0],
    };
  });
  const [snapEnabled, setSnapEnabled] = useState(defaults.snap.enabled);
  const [snapPixels, setSnapPixels] = useState(defaults.snap.pixels);
  const snapMm = snapEnabled ? snapPixels / MM_TO_PX : 0;
  const [zoom, setZoom] = useState(defaults.zoom);
  const [editingId, setEditingId] = useState(null);
  const quillRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(defaults.panels.left.width);
  const [rightWidth, setRightWidth] = useState(defaults.panels.right.width);
  const [showGuides, setShowGuides] = useState(defaults.view.showGuides);
  const [showGrid, setShowGrid] = useState(defaults.view.showGrid);
  const [sessions, setSessions] = useState(() => listSessions());
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === 'mobile' || breakpoint === 'tablet';
  const isTouchOnly = useNeedsPointerWarning();
  const [deviceWarningDismissed, setDeviceWarningDismissed] = useState(() => {
    try {
      return localStorage.getItem(defaults.persistence.deviceWarningKey) === '1';
    } catch {
      return false;
    }
  });
  const showDeviceWarning =
    defaults.deviceWarning.enabled && isTouchOnly && !deviceWarningDismissed;

  function dismissDeviceWarning() {
    setDeviceWarningDismissed(true);
    try {
      localStorage.setItem(defaults.persistence.deviceWarningKey, '1');
    } catch {
    }
  }

  const historyRef = useRef(null);
  const applyingHistoryRef = useRef(false);
  const [, forceHistoryUpdate] = useReducer((x) => x + 1, 0);

  if (!historyRef.current) {
    const initial = loadInitialDoc();
    historyRef.current = loadHistory(initial, {
      maxNodes: defaults.history.maxNodes,
    });
  }
  const history = historyRef.current;

  const bumpHistory = useCallback(() => {
    forceHistoryUpdate();
  }, []);

  const doUndo = useCallback(() => {
    const h = historyRef.current;
    if (!h || !h.canUndo()) return;
    const prev = h.undo();
    if (prev) {
      applyingHistoryRef.current = true;
      setDoc(prev);
      saveHistory(h);
      bumpHistory();
      Promise.resolve().then(() => {
        applyingHistoryRef.current = false;
      });
    }
  }, [bumpHistory]);

  const doRedo = useCallback(() => {
    const h = historyRef.current;
    if (!h || !h.canRedo()) return;
    const next = h.redo();
    if (next) {
      applyingHistoryRef.current = true;
      setDoc(next);
      saveHistory(h);
      bumpHistory();
      Promise.resolve().then(() => {
        applyingHistoryRef.current = false;
      });
    }
  }, [bumpHistory]);

  const doSaveSnapshot = useCallback(
    (name) => {
      const entry = saveSession(
        doc,
        name || defaultSessionName(),
        historyRef.current,
        defaults.session.maxSessions
      );
      setSessions(listSessions());
      return entry;
    },
    [doc]
  );

  const doLoadSnapshot = useCallback(
    (id) => {
      const session = loadSession(id);
      if (!session) return;
      const restored = session.history
        ? restoreHistory(session.history, { maxNodes: defaults.history.maxNodes })
        : null;
      applyingHistoryRef.current = true;
      setDoc(session.doc);
      if (restored) {
        historyRef.current = restored;
      } else {
        historyRef.current = createHistory(session.doc, {
          maxNodes: defaults.history.maxNodes,
        });
      }
      saveHistory(historyRef.current);
      setCurrentPage(0);
      setSelectedIds([]);
      setEditingId(null);
      bumpHistory();
      Promise.resolve().then(() => {
        applyingHistoryRef.current = false;
      });
    },
    [bumpHistory]
  );

  const doDeleteSnapshot = useCallback((id) => {
    deleteSession(id);
    setSessions(listSessions());
  }, []);

  const doRenameSnapshot = useCallback((id, name) => {
    renameSession(id, name);
    setSessions(listSessions());
  }, []);

  const pageDoc = doc.pages[currentPage];

  const setPageDoc = useCallback(
    (updater) => {
      setDoc((prev) => {
        const pages = [...prev.pages];
        const nextPage =
          typeof updater === 'function' ? updater(pages[currentPage]) : updater;
        pages[currentPage] = nextPage;
        return { ...prev, pages };
      });
    },
    [currentPage]
  );

  const setAllPagesDoc = useCallback(
    (updater) => {
      setDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          typeof updater === 'function' ? updater(p) : updater
        ),
      }));
    },
    []
  );

  const startEditing = useCallback(
    (id) => {
      if (mode !== 'design') return;
      const el = pageDoc.elements.find((item) => item.id === id);
      if (!el || el.type !== 'text') return;
      setSelectedIds([id]);
      setEditingId(id);
    },
    [mode, pageDoc.elements]
  );

  const stopEditing = useCallback(
    (save) => {
      if (!editingId) return;
      if (save && quillRef.current) {
        const html = quillRef.current.getEditor().root.innerHTML;
        setPageDoc((prev) => ({
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === editingId ? { ...el, content: html } : el
          ),
        }));
      }
      setEditingId(null);
    },
    [editingId, quillRef, setPageDoc]
  );

  const actions = useDocumentActions({
    setDoc,
    setPageDoc,
    setAllPagesDoc,
    currentPage,
    pageDoc,
    setSelectedIds,
    setMode,
    setCurrentPage,
    setZoom,
    historyRef,
    applyingHistoryRef,
    bumpHistory,
    defaults,
  });

  useEffect(() => {
    setEditingId(null);
  }, [currentPage]);

  useEffect(() => {
    if (!editingId) return;
    const exists = doc.pages.some((p) =>
      p.elements.some((el) => el.id === editingId)
    );
    if (!exists) setEditingId(null);
  }, [doc, editingId]);

  useEffect(() => {
    if (applyingHistoryRef.current) return;
    const handle = setTimeout(() => {
      const node = history.commit(doc, 'Edit');
      if (node) {
        saveHistory(history);
        bumpHistory();
      }
    }, defaults.history.commitDebounceMs);
    return () => clearTimeout(handle);
  }, [doc, history, bumpHistory]);

  useEffect(() => {
    saveCurrent(doc);
  }, [doc]);

  useEffect(() => {
    saveMergeData(data);
  }, [data]);

  useEffect(() => {
    if (!defaults.session.autoSaveEnabled) return;
    const handle = setInterval(() => {
      saveCurrent(doc);
      saveHistory(history);
      saveMergeData(data);
    }, defaults.session.autoSaveIntervalMs);
    return () => clearInterval(handle);
  }, [doc, history, data]);

  function updateLeftWidth(dx) {
    setLeftWidth((w) =>
      Math.max(defaults.panels.left.min, Math.min(defaults.panels.left.max, w + dx))
    );
  }

  function updateRightWidth(dx) {
    setRightWidth((w) =>
      Math.max(defaults.panels.right.min, Math.min(defaults.panels.right.max, w - dx))
    );
  }

  function Resizer({ onDelta }) {
    function onPointerDown(e) {
      e.preventDefault();
      let lastX = e.clientX;
      function move(ev) {
        const dx = ev.clientX - lastX;
        lastX = ev.clientX;
        onDelta(dx);
      }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    }
    return (
      <div
        className="w-1.5 cursor-col-resize hover:bg-brand-accent active:bg-brand-accentDark"
        onPointerDown={onPointerDown}
      />
    );
  }

  useEffect(() => {
    function key(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        stopEditing(false);
      }
    }
    if (editingId) {
      window.addEventListener('keydown', key);
      return () => window.removeEventListener('keydown', key);
    }
  }, [editingId, stopEditing]);

  useEffect(() => {
    if (currentPage >= doc.pages.length) {
      setCurrentPage(Math.max(0, doc.pages.length - 1));
      setSelectedIds([]);
    }
  }, [doc.pages.length, currentPage]);

  function fitToScreen() {
    const main = document.getElementById('docugine-canvas-area');
    if (!main) return;
    const padding = 32;
    const available = main.clientWidth - padding;
    const pageWidthPx = defaults.canvas.pageWidth * MM_TO_PX;
    if (available <= 0 || pageWidthPx <= 0) return;
    const next = Math.max(
      defaults.zoomMin,
      Math.min(defaults.zoomMax, available / pageWidthPx)
    );
    setZoom(next);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (isEditableTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        doUndo();
        return;
      }
      if (
        mod &&
        ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
          (!e.shiftKey && (e.key === 'y' || e.key === 'Y')))
      ) {
        e.preventDefault();
        doRedo();
        return;
      }
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        doSaveSnapshot();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          setPageDoc((prev) => ({
            ...prev,
            elements: deleteElements(prev.elements, selectedIds),
          }));
          setSelectedIds([]);
        }
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, currentPage, setPageDoc, doUndo, doRedo, doSaveSnapshot]);

  function confirmDeletePage() {
    if (doc.pages.length <= 1) return;
    if (!window.confirm('Delete the current page?')) return;
    actions.deletePage();
  }

  function confirmLoadTemplate(key) {
    const template = TEMPLATES[key];
    if (!template) return;
    if (
      window.confirm(
        `Load the ${template.label} template? This will replace your current document.`
      )
    ) {
      actions.loadTemplate(template);
    }
  }

  function confirmReset() {
    if (window.confirm('Reset to the default template?')) {
      actions.resetTemplate();
    }
  }

  function renderRightPanel() {
    return (
      <>
        {mode === 'design' && (
          <>
            <PropertyPanel
              doc={pageDoc}
              actions={actions}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              editingId={editingId}
              quillRef={quillRef}
            />
          </>
        )}
        <SessionPanel
          sessions={sessions}
          canUndo={history.canUndo()}
          canRedo={history.canRedo()}
          onUndo={doUndo}
          onRedo={doRedo}
          onSave={() => doSaveSnapshot()}
          onLoad={doLoadSnapshot}
          onDelete={doDeleteSnapshot}
          onRename={doRenameSnapshot}
          historyDepth={history.size()}
        />
        {mode === 'merge' && (
          <DataPanel doc={doc} data={data} setData={setData} />
        )}
        {mode === 'json' && <JsonPanel doc={doc} setDoc={setDoc} />}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-surfaceAlt font-sans">
      <DeviceWarningDialog
        open={showDeviceWarning}
        onDismiss={dismissDeviceWarning}
        title={defaults.deviceWarning.title}
        message={defaults.deviceWarning.message}
      />
      <Toolbar
        mode={mode}
        setMode={setMode}
        zoom={zoom}
        setZoom={setZoom}
        zoomMin={defaults.zoomMin}
        zoomMax={defaults.zoomMax}
        zoomStep={defaults.zoomStep}
        snapEnabled={snapEnabled}
        setSnapEnabled={setSnapEnabled}
        snapPixels={snapPixels}
        setSnapPixels={setSnapPixels}
        currentPage={currentPage}
        pageCount={doc.pages.length}
        onPrevPage={() => {
          setCurrentPage((p) => Math.max(0, p - 1));
          setSelectedIds([]);
        }}
        onNextPage={() => {
          setCurrentPage((p) => Math.min(doc.pages.length - 1, p + 1));
          setSelectedIds([]);
        }}
        onAddPage={actions.addPage}
        onDeletePage={confirmDeletePage}
        onAddElement={actions.addElement}
        onAddHeading={actions.addHeading}
        onAddSignature={actions.addSignature}
        onAddWatermark={actions.addWatermark}
        templates={TEMPLATES}
        onLoadTemplate={confirmLoadTemplate}
        onReset={confirmReset}
        onUndo={doUndo}
        onRedo={doRedo}
        canUndo={history.canUndo()}
        canRedo={history.canRedo()}
        onSaveSnapshot={() => doSaveSnapshot()}
        onLoadSnapshot={doLoadSnapshot}
        editingId={editingId}
        doc={pageDoc}
        setDoc={setAllPagesDoc}
        setSelectedIds={setSelectedIds}
        selectedIds={selectedIds}
        quillRef={quillRef}
        onDoneEditing={() => stopEditing(true)}
        actions={actions}
        showGuides={showGuides}
        setShowGuides={setShowGuides}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        initialActiveTab={defaults.initialActiveTab}
        isCompact={isCompact}
        onFitToScreen={fitToScreen}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {!isCompact && (
          <aside
            className="flex-shrink-0 bg-brand-surface border-r border-gray-200 overflow-y-auto p-3"
            style={{ width: leftWidth }}
          >
            <ElementList
              doc={pageDoc}
              actions={actions}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          </aside>
        )}

        {!isCompact && <Resizer onDelta={updateLeftWidth} />}

        <section
          id="docugine-canvas-area"
          className="flex-1 min-w-0 bg-gray-200 overflow-auto p-4"
        >
          <DesignCanvas
            doc={pageDoc}
            setDoc={setPageDoc}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            mode={mode}
            data={data}
            snapMm={snapMm}
            zoom={zoom}
            setZoom={setZoom}
            editingId={editingId}
            onEditStart={startEditing}
            stopEditing={stopEditing}
            quillRef={quillRef}
            showGuides={showGuides}
            showGrid={showGrid}
          />
        </section>

        {!isCompact && <Resizer onDelta={updateRightWidth} />}

        {!isCompact && (
          <aside
            className="flex-shrink-0 bg-brand-surface border-l border-gray-200 overflow-y-auto p-3"
            style={{ width: rightWidth }}
          >
            {renderRightPanel()}
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;
