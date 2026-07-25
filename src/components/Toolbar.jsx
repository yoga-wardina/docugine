import React, { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import {
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Grid3x3,
  Pencil,
  Square,
  Image as ImageIcon,
  Minus as LineIcon,
  Heading1,
  PenLine,
  Droplet,
  RotateCcw,
  FileText,
  Type,
  Undo2,
  Redo2,
  Camera,
} from 'lucide-react';
import {
  StylingButtons,
  AlignmentButtons,
  ListButtons,
  TextButtons,
} from './EditorToolbar';

const tipId = 'docugine-tip';

function Group({ title, children, grow }) {
  return (
    <div
      className="flex flex-col border-r border-gray-300 px-2.5 py-1"
      style={grow ? { flex: 1 } : undefined}
    >
      <div className="flex items-center gap-1 flex-wrap flex-1 py-1">{children}</div>
      <div className="text-[0.7rem] text-gray-500 text-center mt-0.5 uppercase tracking-wider">
        {title}
      </div>
    </div>
  );
}

const tabBtn =
  'px-3.5 py-1.5 text-sm text-gray-600 rounded-t hover:bg-gray-200 hover:text-gray-900 relative';
const tabBtnActive =
  'bg-brand-surfaceAlt text-gray-900 font-semibold after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-brand-accent';
const ribbonBtn =
  'inline-flex items-center justify-center gap-1 bg-white text-gray-900 border border-transparent rounded px-2 py-1 text-sm cursor-pointer min-w-[28px] leading-tight hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed';
const ribbonBtnActive = 'bg-brand-accent text-white border-brand-accentDark';
const ico = { size: 14, strokeWidth: 2 };
const dangerBtn =
  'bg-brand-danger text-white border-none rounded px-3 py-1.5 text-sm cursor-pointer hover:bg-brand-dangerDark';

export default function Toolbar(props) {
  const { initialActiveTab = 'home' } = props;
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const { onReset, editingId } = props;

  // Auto-switch to the Format tab whenever a text element is being edited.
  useEffect(() => {
    if (editingId) {
      setActiveTab('format');
    }
  }, [editingId]);

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'view', label: 'View' },
    { id: 'format', label: 'Format' },
  ];

  return (
    <div className="bg-brand-surfaceAlt text-gray-900 border-b border-gray-300 flex-shrink-0">
      <div className="flex items-center gap-3 px-3.5 py-1.5 bg-white border-b border-gray-200">
        <div className="flex items-baseline gap-2 min-w-[160px]">
          <strong className="text-lg font-bold text-gray-900">Docugine</strong>
          <span className="text-gray-500 text-sm">A4 templating</span>
        </div>
        <div className="flex gap-0.5 flex-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${tabBtn} ${activeTab === t.id ? tabBtnActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div>
          <button type="button" className={`${dangerBtn} inline-flex items-center gap-1`} onClick={onReset}>
            <RotateCcw {...ico} /> Reset
          </button>
        </div>
      </div>
      <div className="flex items-stretch px-3.5 py-1.5 gap-0 bg-brand-surface border-t border-gray-200 overflow-x-auto min-h-[70px]">
        {activeTab === 'home' && <HomeTab {...props} />}
        {activeTab === 'insert' && <InsertTab {...props} />}
        {activeTab === 'view' && <ViewTab {...props} />}
        {activeTab === 'format' && <FormatTab {...props} />}
      </div>
      <Tooltip id={tipId} place="bottom" effect="solid" delayShow={300} />
    </div>
  );
}

function HomeTab({
  onPrevPage,
  onNextPage,
  onAddPage,
  onDeletePage,
  currentPage,
  pageCount,
  zoom,
  setZoom,
  zoomMin,
  zoomMax,
  zoomStep,
  snapEnabled,
  setSnapEnabled,
  snapPixels,
  setSnapPixels,
  mode,
  setMode,
  showGrid,
  setShowGrid,
  templates,
  onLoadTemplate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveSnapshot,
}) {
  const zMin = zoomMin ?? 0.1;
  const zMax = zoomMax ?? 5;
  const zStep = zoomStep ?? 1.2;
  return (
    <>
      <Group title="Document">
        <button type="button" className={ribbonBtn} onClick={onPrevPage} disabled={currentPage === 0} title="Previous page">
          <span className="text-base leading-none">‹</span>
        </button>
        <span className="text-sm min-w-[36px] text-center text-gray-900">
          {currentPage + 1}/{pageCount}
        </span>
        <button
          type="button"
          className={ribbonBtn}
          onClick={onNextPage}
          disabled={currentPage === pageCount - 1}
          title="Next page"
        >
          <span className="text-base leading-none">›</span>
        </button>
        <button type="button" className={ribbonBtn} onClick={onAddPage} title="Add page">
          <Plus {...ico} />
        </button>
        <button
          type="button"
          className={`${ribbonBtn} bg-brand-danger text-white hover:bg-brand-dangerDark`}
          onClick={onDeletePage}
          disabled={pageCount <= 1}
          title="Delete page"
        >
          <Minus {...ico} />
        </button>
      </Group>
      <Group title="History">
        <button
          type="button"
          className={ribbonBtn}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 {...ico} />
        </button>
        <button
          type="button"
          className={ribbonBtn}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 {...ico} />
        </button>
        <button
          type="button"
          className={`${ribbonBtn} bg-brand-accent text-white hover:bg-brand-accentDark`}
          onClick={onSaveSnapshot}
          title="Save snapshot (Ctrl+S)"
        >
          <Camera {...ico} /> Snapshot
        </button>
      </Group>
      <Group title="Zoom">
        <button type="button" className={ribbonBtn} onClick={() => setZoom((z) => Math.max(zMin, z / zStep))} title="Zoom out">
          <ZoomOut {...ico} />
        </button>
        <span className="text-sm min-w-[36px] text-center text-gray-900">{Math.round(zoom * 100)}%</span>
        <button type="button" className={ribbonBtn} onClick={() => setZoom((z) => Math.min(zMax, z * zStep))} title="Zoom in">
          <ZoomIn {...ico} />
        </button>
        <button type="button" className={ribbonBtn} onClick={() => setZoom(1)} title="Fit to window">
          <Maximize2 {...ico} />
        </button>
      </Group>
      <Group title="Snap">
        <label className="flex items-center gap-1.5 text-sm text-gray-900 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-brand-accent"
            checked={snapEnabled}
            onChange={(e) => setSnapEnabled(e.target.checked)}
          />
          <Pencil {...ico} /> Snap
        </label>
        <input
          className="w-[50px] border border-gray-300 rounded px-1.5 py-0.5 text-sm"
          type="number"
          min={1}
          step={1}
          value={snapPixels}
          onChange={(e) => setSnapPixels(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
        <span className="text-xs text-gray-500">px</span>
        <label className="flex items-center gap-1.5 text-sm text-gray-900 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-brand-accent"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          <Grid3x3 {...ico} /> Grid
        </label>
      </Group>
      <Group title="Mode">
        <button
          type="button"
          className={`${ribbonBtn} ${mode === 'design' ? ribbonBtnActive : ''}`}
          onClick={() => setMode('design')}
        >
          <Pencil {...ico} /> Design
        </button>
        <button
          type="button"
          className={`${ribbonBtn} ${mode === 'merge' ? ribbonBtnActive : ''}`}
          onClick={() => setMode('merge')}
        >
          <FileText {...ico} /> Merge
        </button>
        <button
          type="button"
          className={`${ribbonBtn} ${mode === 'json' ? ribbonBtnActive : ''}`}
          onClick={() => setMode('json')}
        >
          <Type {...ico} /> JSON
        </button>
      </Group>
      <Group title="Templates">
        <select
          className="border border-gray-300 rounded px-1.5 py-0.5 text-sm bg-white text-gray-900"
          value=""
          onChange={(e) => {
            const k = e.target.value;
            if (k) onLoadTemplate(k);
            e.target.value = '';
          }}
        >
          <option value="">Load template...</option>
          {Object.entries(templates).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </Group>
    </>
  );
}

function InsertTab({
  onAddElement,
  onAddHeading,
  onAddSignature,
  onAddWatermark,
}) {
  return (
    <>
      <Group title="Elements">
        <button
          type="button"
          className={ribbonBtn}
          onClick={() => onAddElement('text')}
          data-tooltip-id={tipId}
          data-tooltip-content="Add text"
        >
          <Type {...ico} />
        </button>
        <button
          type="button"
          className={ribbonBtn}
          onClick={() => onAddElement('rect')}
          data-tooltip-id={tipId}
          data-tooltip-content="Add rectangle"
        >
          <Square {...ico} />
        </button>
        <button
          type="button"
          className={ribbonBtn}
          onClick={() => onAddElement('image')}
          data-tooltip-id={tipId}
          data-tooltip-content="Add image"
        >
          <ImageIcon {...ico} />
        </button>
        <button
          type="button"
          className={ribbonBtn}
          onClick={() => onAddElement('line')}
          data-tooltip-id={tipId}
          data-tooltip-content="Add line"
        >
          <LineIcon {...ico} />
        </button>
        <button
          type="button"
          className={ribbonBtn}
          onClick={onAddHeading}
          data-tooltip-id={tipId}
          data-tooltip-content="Add heading"
        >
          <Heading1 {...ico} />
        </button>
        <button
          type="button"
          className={ribbonBtn}
          onClick={onAddSignature}
          data-tooltip-id={tipId}
          data-tooltip-content="Add signature"
        >
          <PenLine {...ico} />
        </button>
        <button
          type="button"
          className={ribbonBtn}
          onClick={onAddWatermark}
          data-tooltip-id={tipId}
          data-tooltip-content="Add watermark"
        >
          <Droplet {...ico} />
        </button>
      </Group>
    </>
  );
}

function ViewTab({
  zoom,
  setZoom,
  zoomMin,
  zoomMax,
  zoomStep,
  snapEnabled,
  setSnapEnabled,
  snapPixels,
  setSnapPixels,
  mode,
  setMode,
  showGuides,
  setShowGuides,
  showGrid,
  setShowGrid,
}) {
  const zMin = zoomMin ?? 0.1;
  const zMax = zoomMax ?? 5;
  const zStep = zoomStep ?? 1.2;
  return (
    <>
      <Group title="Zoom">
        <button type="button" className={ribbonBtn} onClick={() => setZoom((z) => Math.max(zMin, z / zStep))} title="Zoom out">
          <ZoomOut {...ico} />
        </button>
        <span className="text-sm min-w-[36px] text-center text-gray-900">{Math.round(zoom * 100)}%</span>
        <button type="button" className={ribbonBtn} onClick={() => setZoom((z) => Math.min(zMax, z * zStep))} title="Zoom in">
          <ZoomIn {...ico} />
        </button>
        <button type="button" className={ribbonBtn} onClick={() => setZoom(1)} title="Fit to window">
          <Maximize2 {...ico} />
        </button>
      </Group>
      <Group title="Snap">
        <label className="flex items-center gap-1.5 text-sm text-gray-900 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-brand-accent"
            checked={snapEnabled}
            onChange={(e) => setSnapEnabled(e.target.checked)}
          />
          <Pencil {...ico} /> Snap
        </label>
        <input
          className="w-[50px] border border-gray-300 rounded px-1.5 py-0.5 text-sm"
          type="number"
          min={1}
          step={1}
          value={snapPixels}
          onChange={(e) => setSnapPixels(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
        <span className="text-xs text-gray-500">px</span>
        <label className="flex items-center gap-1.5 text-sm text-gray-900 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-brand-accent"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          <Grid3x3 {...ico} /> Grid
        </label>
      </Group>
      <Group title="Mode">
        <button
          type="button"
          className={`${ribbonBtn} ${mode === 'design' ? ribbonBtnActive : ''}`}
          onClick={() => setMode('design')}
        >
          <Pencil {...ico} /> Design
        </button>
        <button
          type="button"
          className={`${ribbonBtn} ${mode === 'merge' ? ribbonBtnActive : ''}`}
          onClick={() => setMode('merge')}
        >
          <FileText {...ico} /> Merge
        </button>
        <button
          type="button"
          className={`${ribbonBtn} ${mode === 'json' ? ribbonBtnActive : ''}`}
          onClick={() => setMode('json')}
        >
          <Type {...ico} /> JSON
        </button>
      </Group>
      <Group title="Guides">
        <button
          type="button"
          className={`${ribbonBtn} ${showGuides ? ribbonBtnActive : ''}`}
          onClick={() => setShowGuides(!showGuides)}
        >
          <Layers {...ico} /> Layer guides
        </button>
      </Group>
    </>
  );
}

function FormatTab({ quillRef, onDoneEditing }) {
  return (
    <>
      <Group title="Styling">
        <StylingButtons quillRef={quillRef} />
      </Group>
      <Group title="Alignments">
        <AlignmentButtons quillRef={quillRef} />
      </Group>
      <Group title="Lists">
        <ListButtons quillRef={quillRef} />
      </Group>
      <Group title="Text" grow>
        <TextButtons quillRef={quillRef} onDone={onDoneEditing} />
      </Group>
    </>
  );
}
