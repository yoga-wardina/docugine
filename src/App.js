import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  defaultDocument,
  defaultLayout,
  newElement,
  newHeadingElement,
  newSignatureTemplate,
  newWatermarkElement,
  importDocument,
  exportDocument,
  MM_TO_PX,
} from './lib/document';
import { TEMPLATES } from './lib/templates';
import DesignCanvas from './components/DesignCanvas';
import ElementList from './components/ElementList';
import PropertyPanel from './components/PropertyPanel';
import DataPanel from './components/DataPanel';
import JsonPanel from './components/JsonPanel';
import PagePanel from './components/PagePanel';
import Toolbar from './components/Toolbar';
import defaults from './config/defaults.json';

const STORAGE_KEY = 'docugine:template';

function loadInitialDoc() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return importDocument(saved);
    }
  } catch {
    // ignore broken storage
  }
  return defaultDocument();
}

function App() {
  const [doc, setDoc] = useState(loadInitialDoc);
  const [currentPage, setCurrentPage] = useState(defaults.currentPage);
  const [selectedIds, setSelectedIds] = useState(defaults.selectedIds);
  const [mode, setMode] = useState(defaults.mode); // 'design' | 'merge' | 'json'
  const [data, setData] = useState(() => ({
    ...defaults.sampleData,
    date: new Date().toISOString().split('T')[0],
  }));
  const [snapEnabled, setSnapEnabled] = useState(defaults.snapEnabled);
  const [snapPixels, setSnapPixels] = useState(defaults.snapPixels);
  const snapMm = snapEnabled ? snapPixels / MM_TO_PX : 0;
  const [zoom, setZoom] = useState(defaults.zoom);
  const [editingId, setEditingId] = useState(null);
  const quillRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(defaults.leftPanelWidth);
  const [rightWidth, setRightWidth] = useState(defaults.rightPanelWidth);
  const [showGuides, setShowGuides] = useState(defaults.showGuides);
  const [showGrid, setShowGrid] = useState(defaults.showGrid);

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

  useEffect(() => {
    setEditingId(null);
  }, [currentPage]);

  function updateLeftWidth(dx) {
    setLeftWidth((w) => Math.max(180, Math.min(600, w + dx)));
  }

  function updateRightWidth(dx) {
    setRightWidth((w) => Math.max(220, Math.min(800, w - dx)));
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
    try {
      localStorage.setItem(STORAGE_KEY, exportDocument(doc));
    } catch {
      // ignore storage errors
    }
  }, [doc]);

  useEffect(() => {
    if (currentPage >= doc.pages.length) {
      setCurrentPage(Math.max(0, doc.pages.length - 1));
      setSelectedIds([]);
    }
  }, [doc.pages.length, currentPage]);

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          setDoc((prev) => {
            const pages = [...prev.pages];
            pages[currentPage] = {
              ...pages[currentPage],
              elements: pages[currentPage].elements.filter(
                (el) => !selectedIds.includes(el.id)
              ),
            };
            return { ...prev, pages };
          });
          setSelectedIds([]);
        }
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, currentPage]);

  function nextOffset() {
    return 20 + (pageDoc.elements.length % 5) * 5;
  }

  function addElement(type) {
    const offset = nextOffset();
    const el = newElement(type, offset, offset);
    setPageDoc((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedIds([el.id]);
    setMode('design');
  }

  function addHeading() {
    const offset = nextOffset();
    const el = newHeadingElement(offset, offset);
    setPageDoc((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedIds([el.id]);
    setMode('design');
  }

  function addSignature() {
    const offset = nextOffset();
    const elements = newSignatureTemplate(offset, offset + 8);
    setPageDoc((prev) => ({ ...prev, elements: [...prev.elements, ...elements] }));
    setSelectedIds(elements.map((el) => el.id));
    setMode('design');
  }

  function addWatermark() {
    const el = newWatermarkElement(55, 100);
    setPageDoc((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedIds([el.id]);
    setMode('design');
  }

  function addPage() {
    setDoc((prev) => ({
      ...prev,
      pages: [
        ...prev.pages,
        {
          page: {
            width: 210,
            height: 297,
            unit: 'mm',
            layout: defaultLayout(),
          },
          elements: [],
        },
      ],
    }));
    setCurrentPage((prev) => prev + 1);
    setSelectedIds([]);
    setMode('design');
  }

  function deletePage() {
    if (doc.pages.length <= 1) return;
    if (!window.confirm('Delete the current page?')) return;
    setDoc((prev) => {
      const pages = prev.pages.filter((_, i) => i !== currentPage);
      return { ...prev, pages };
    });
    setCurrentPage((prev) => Math.max(0, prev - 1));
    setSelectedIds([]);
  }

  function loadTemplate(key) {
    const template = TEMPLATES[key];
    if (!template) return;
    if (
      window.confirm(
        `Load the ${template.label} template? This will replace your current document.`
      )
    ) {
      setDoc(template.factory());
      setCurrentPage(0);
      setSelectedIds([]);
      setMode('design');
      setZoom(1);
    }
  }

  function resetTemplate() {
    if (window.confirm('Reset to the default template?')) {
      setDoc(defaultDocument());
      setCurrentPage(0);
      setSelectedIds([]);
      setZoom(1);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-surfaceAlt font-sans">
      <Toolbar
        mode={mode}
        setMode={setMode}
        zoom={zoom}
        setZoom={setZoom}
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
        onAddPage={addPage}
        onDeletePage={deletePage}
        onAddElement={addElement}
        onAddHeading={addHeading}
        onAddSignature={addSignature}
        onAddWatermark={addWatermark}
        templates={TEMPLATES}
        onLoadTemplate={loadTemplate}
        onReset={resetTemplate}
        editingId={editingId}
        selectedIds={selectedIds}
        quillRef={quillRef}
        onDoneEditing={() => stopEditing(true)}
        showGuides={showGuides}
        setShowGuides={setShowGuides}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        initialActiveTab={defaults.initialActiveTab}
      />

      <main className="flex-1 flex overflow-hidden">
        <aside
          className="flex-shrink-0 bg-brand-surface border-r border-gray-200 overflow-y-auto p-3"
          style={{ width: leftWidth }}
        >
          <ElementList
            doc={pageDoc}
            setDoc={setPageDoc}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
          />
        </aside>

        <Resizer onDelta={updateLeftWidth} />

        <section className="flex-1 min-w-0 bg-gray-200 overflow-auto p-4">
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

        <Resizer onDelta={updateRightWidth} />

        <aside
          className="flex-shrink-0 bg-brand-surface border-l border-gray-200 overflow-y-auto p-3"
          style={{ width: rightWidth }}
        >
          {mode === 'design' && (
            <>
              <PropertyPanel
                doc={pageDoc}
                setDoc={setPageDoc}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                editingId={editingId}
                quillRef={quillRef}
              />
              <PagePanel
                doc={pageDoc}
                setDoc={setPageDoc}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
              />
            </>
          )}
          {mode === 'merge' && (
            <DataPanel doc={doc} data={data} setData={setData} />
          )}
          {mode === 'json' && <JsonPanel doc={doc} setDoc={setDoc} />}
        </aside>
      </main>
    </div>
  );
}

export default App;
