import React from 'react';
import { newWatermarkElement } from '../lib/document';

const inputCls =
  'border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900 bg-white w-full focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20';
const labelCls = 'block font-semibold mb-1.5 text-sm text-gray-700';
const rowCls = 'flex gap-2 mb-2';
const colCls = 'flex-1 flex flex-col';
const colSpanCls = 'text-xs text-gray-500 mb-0.5';
const hintCls = 'text-xs text-gray-500 mb-2.5 leading-snug';
const sectionCls = 'mb-3';
const panelCls = 'bg-white border border-gray-200 rounded-lg p-3 mb-3';
const primaryBtn =
  'bg-brand-accent text-white border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-brand-accentDark';
const dangerBtn =
  'bg-brand-danger text-white border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-brand-dangerDark';

export default function PagePanel({ doc, setDoc, selectedIds, setSelectedIds }) {
  const layout = doc.page.layout || {
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    marginGuideStyle: 'dotted',
    marginGuideColor: '#94a3b8',
    showMargins: true,
    strictMargin: false,
    snapToMargin: false,
  };

  const watermarks = doc.elements.filter((el) => el.type === 'watermark');
  const watermark = watermarks[0];

  function updateLayout(patch) {
    setDoc((prev) => ({
      ...prev,
      page: {
        ...prev.page,
        layout: { ...layout, ...patch },
      },
    }));
  }

  function updateMargins(patch) {
    updateLayout({ margins: { ...layout.margins, ...patch } });
  }

  function addWatermark() {
    const el = newWatermarkElement(55, 100);
    setDoc((prev) => ({
      ...prev,
      elements: [...prev.elements, el],
    }));
    setSelectedIds([el.id]);
  }

  function removeWatermark() {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.type !== 'watermark'),
    }));
    setSelectedIds((prev) => prev.filter((id) => !watermarks.find((w) => w.id === id)));
  }

  function updateWatermark(patch) {
    if (!watermark) return;
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === watermark.id ? { ...el, ...patch } : el
      ),
    }));
  }

  function updateWatermarkStyle(patch) {
    if (!watermark) return;
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === watermark.id ? { ...el, style: { ...el.style, ...patch } } : el
      ),
    }));
  }

  return (
    <div className={panelCls}>
      <h3 className="mt-0 mb-3 text-base text-gray-900">Page layout</h3>

      <div className={sectionCls}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-brand-accent"
            checked={layout.showMargins}
            onChange={(e) => updateLayout({ showMargins: e.target.checked })}
          />
          Show margin guides
        </label>
      </div>

      {layout.showMargins && (
        <>
          <div className={sectionCls}>
            <label className={labelCls}>Guide style</label>
            <select
              className={inputCls}
              value={layout.marginGuideStyle}
              onChange={(e) => updateLayout({ marginGuideStyle: e.target.value })}
            >
              <option value="solid">Solid</option>
              <option value="dotted">Dotted</option>
              <option value="stripped">Stripped</option>
            </select>
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>Guide color</label>
            <input
              className="h-9 w-full border border-gray-300 rounded-md"
              type="color"
              value={layout.marginGuideColor}
              onChange={(e) => updateLayout({ marginGuideColor: e.target.value })}
            />
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>Margins (mm)</label>
            <div className={rowCls}>
              <div className={colCls}>
                <span className={colSpanCls}>Top</span>
                <input
                  className={inputCls}
                  type="number"
                  step="1"
                  min="0"
                  value={layout.margins.top}
                  onChange={(e) =>
                    updateMargins({ top: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className={colCls}>
                <span className={colSpanCls}>Bottom</span>
                <input
                  className={inputCls}
                  type="number"
                  step="1"
                  min="0"
                  value={layout.margins.bottom}
                  onChange={(e) =>
                    updateMargins({ bottom: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className={rowCls}>
              <div className={colCls}>
                <span className={colSpanCls}>Left</span>
                <input
                  className={inputCls}
                  type="number"
                  step="1"
                  min="0"
                  value={layout.margins.left}
                  onChange={(e) =>
                    updateMargins({ left: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className={colCls}>
                <span className={colSpanCls}>Right</span>
                <input
                  className={inputCls}
                  type="number"
                  step="1"
                  min="0"
                  value={layout.margins.right}
                  onChange={(e) =>
                    updateMargins({ right: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>

          <div className={sectionCls}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand-accent"
                checked={layout.snapToMargin}
                onChange={(e) => updateLayout({ snapToMargin: e.target.checked })}
              />
              Snap to margin
            </label>
          </div>

          <div className={sectionCls}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand-accent"
                checked={layout.strictMargin}
                onChange={(e) => updateLayout({ strictMargin: e.target.checked })}
              />
              Strict margin
            </label>
            <p className={hintCls}>
              Layers cannot be moved or resized beyond the margin guides.
            </p>
          </div>
        </>
      )}

      <div className={sectionCls}>
        <label className={labelCls}>Watermark</label>
        {!watermark ? (
          <button className={primaryBtn} onClick={addWatermark}>
            Add watermark
          </button>
        ) : (
          <>
            <p className={hintCls}>
              The watermark sits at the very bottom of the page. Drag and resize
              it on the canvas.
            </p>
            <input
              className={inputCls}
              type="text"
              placeholder="Image URL"
              value={watermark.content}
              onChange={(e) => updateWatermark({ content: e.target.value })}
            />
            <div className={rowCls}>
              <div className={colCls}>
                <span className={colSpanCls}>Opacity</span>
                <input
                  className={inputCls}
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={watermark.style.opacity ?? 0.15}
                  onChange={(e) =>
                    updateWatermarkStyle({ opacity: parseFloat(e.target.value) ?? 0.15 })
                  }
                />
              </div>
              <div className={colCls}>
                <span className={colSpanCls}>Fit</span>
                <select
                  className={inputCls}
                  value={watermark.style.objectFit || 'cover'}
                  onChange={(e) =>
                    updateWatermarkStyle({ objectFit: e.target.value })
                  }
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
            <button className={dangerBtn} onClick={removeWatermark}>
              Remove watermark
            </button>
          </>
        )}
      </div>
    </div>
  );
}
