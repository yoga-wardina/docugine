import React from 'react';
import { Droplet, X, ArrowUp, ArrowDown } from 'lucide-react';
import { newWatermarkElement, defaultHeader, defaultFooter } from '../lib/document';

const ico = { size: 14, strokeWidth: 2 };

const numCls =
  'w-12 border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-900 bg-white text-center focus:outline-none focus:border-brand-accent';
const selCls =
  'border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-900 bg-white focus:outline-none focus:border-brand-accent';
const colorCls =
  'h-7 w-9 border border-gray-300 rounded cursor-pointer bg-white p-0';
const checkboxCls = 'w-3.5 h-3.5 accent-brand-accent cursor-pointer';
const textCls =
  'border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-900 bg-white focus:outline-none focus:border-brand-accent';
const primaryBtn =
  'inline-flex items-center gap-1 bg-brand-accent text-white border-none rounded px-2 py-1 text-xs cursor-pointer hover:bg-brand-accentDark';
const dangerBtn =
  'inline-flex items-center gap-1 bg-brand-danger text-white border-none rounded px-2 py-1 text-xs cursor-pointer hover:bg-brand-dangerDark';

function Group({ title, children }) {
  return (
    <div className="flex flex-col border-r border-gray-300 px-2.5 py-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap flex-1 py-1">{children}</div>
      <div className="text-[0.7rem] text-gray-500 text-center mt-0.5 uppercase tracking-wider">
        {title}
      </div>
    </div>
  );
}

function NumField({ value, onChange, min = 0, step = 1, label }) {
  return (
    <label className="inline-flex items-center gap-1 text-xs text-gray-700">
      <span className="text-gray-500 w-3 text-right">{label}</span>
      <input
        className={numCls}
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </label>
  );
}

export default function PageTab({ doc, setDoc, setSelectedIds, onAddWatermark }) {
  const layout = doc.page.layout || {
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    marginGuideStyle: 'dotted',
    marginGuideColor: '#94a3b8',
    showMargins: true,
    strictMargin: false,
    snapToMargin: false,
  };
  const header = doc.page.header || defaultHeader();
  const footer = doc.page.footer || defaultFooter();

  const watermarks = doc.elements.filter((el) => el.type === 'watermark');
  const watermark = watermarks[0];

  function updateLayout(patch) {
    setDoc((prev) => {
      const currentLayout = prev.page?.layout || layout;
      return {
        ...prev,
        page: { ...prev.page, layout: { ...currentLayout, ...patch } },
      };
    });
  }

  function updateMargins(patch) {
    setDoc((prev) => {
      const currentLayout = prev.page?.layout || layout;
      const currentMargins = currentLayout.margins || layout.margins;
      const next = { ...currentMargins, ...patch };
      const currentHeader = prev.page?.header || header;
      const currentFooter = prev.page?.footer || footer;
      if (currentHeader.enabled && patch.top !== undefined) {
        next.top = Math.max(patch.top, currentHeader.height || 0);
      }
      if (currentFooter.enabled && patch.bottom !== undefined) {
        next.bottom = Math.max(patch.bottom, currentFooter.height || 0);
      }
      return {
        ...prev,
        page: {
          ...prev.page,
          layout: { ...currentLayout, margins: next },
        },
      };
    });
  }

  function updateHeader(patch) {
    setDoc((prev) => {
      const currentHeader = prev.page?.header || defaultHeader();
      const nextHeader = { ...currentHeader, ...patch };
      const currentLayout = prev.page?.layout || layout;
      const currentFooter = prev.page?.footer || footer;
      let nextLayout = currentLayout;
      if (nextHeader.enabled) {
        const need = nextHeader.height || 0;
        if ((currentLayout.margins?.top ?? 0) < need) {
          nextLayout = {
            ...currentLayout,
            margins: {
              ...(currentLayout.margins || layout.margins),
              top: need,
            },
          };
        }
      }
      return {
        ...prev,
        page: {
          ...prev.page,
          header: nextHeader,
          layout: nextLayout,
          footer: currentFooter,
        },
      };
    });
  }

  function updateFooter(patch) {
    setDoc((prev) => {
      const currentFooter = prev.page?.footer || defaultFooter();
      const nextFooter = { ...currentFooter, ...patch };
      const currentLayout = prev.page?.layout || layout;
      const currentHeader = prev.page?.header || header;
      let nextLayout = currentLayout;
      if (nextFooter.enabled) {
        const need = nextFooter.height || 0;
        if ((currentLayout.margins?.bottom ?? 0) < need) {
          nextLayout = {
            ...currentLayout,
            margins: {
              ...(currentLayout.margins || layout.margins),
              bottom: need,
            },
          };
        }
      }
      return {
        ...prev,
        page: {
          ...prev.page,
          footer: nextFooter,
          layout: nextLayout,
          header: currentHeader,
        },
      };
    });
  }

  function addWatermark() {
    if (onAddWatermark) {
      onAddWatermark();
      return;
    }
    const el = newWatermarkElement(55, 100);
    setDoc((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedIds?.([el.id]);
  }

  function removeWatermark() {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.type !== 'watermark'),
    }));
    setSelectedIds?.([]);
  }

  function updateWatermark(patch) {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.type === 'watermark' ? { ...el, ...patch } : el
      ),
    }));
  }

  function updateWatermarkStyle(patch) {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.type === 'watermark' ? { ...el, style: { ...el.style, ...patch } } : el
      ),
    }));
  }

  return (
    <>
      <Group title="Margins (mm)">
        <NumField
          label="T"
          value={layout.margins.top}
          onChange={(v) => updateMargins({ top: v })}
        />
        <NumField
          label="B"
          value={layout.margins.bottom}
          onChange={(v) => updateMargins({ bottom: v })}
        />
        <NumField
          label="L"
          value={layout.margins.left}
          onChange={(v) => updateMargins({ left: v })}
        />
        <NumField
          label="R"
          value={layout.margins.right}
          onChange={(v) => updateMargins({ right: v })}
        />
      </Group>

      <Group title="Guides">
        <label className="inline-flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className={checkboxCls}
            checked={layout.showMargins}
            onChange={(e) => updateLayout({ showMargins: e.target.checked })}
          />
          Show
        </label>
        <label className="inline-flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className={checkboxCls}
            checked={layout.snapToMargin}
            onChange={(e) => updateLayout({ snapToMargin: e.target.checked })}
          />
          Snap
        </label>
        <label className="inline-flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className={checkboxCls}
            checked={layout.strictMargin}
            onChange={(e) => updateLayout({ strictMargin: e.target.checked })}
          />
          Strict
        </label>
        <select
          className={selCls}
          value={layout.marginGuideStyle}
          onChange={(e) => updateLayout({ marginGuideStyle: e.target.value })}
          title="Guide style"
        >
          <option value="solid">Solid</option>
          <option value="dotted">Dotted</option>
          <option value="stripped">Stripped</option>
        </select>
        <input
          className={colorCls}
          type="color"
          value={layout.marginGuideColor}
          onChange={(e) => updateLayout({ marginGuideColor: e.target.value })}
          title="Guide color"
        />
      </Group>

      <Group title="Header">
        <label className="inline-flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className={checkboxCls}
            checked={header.enabled}
            onChange={(e) => updateHeader({ enabled: e.target.checked })}
          />
          On
        </label>
        <NumField
          label="H"
          value={header.height}
          onChange={(v) => updateHeader({ height: Math.max(0, v) })}
        />
        <input
          className={`${textCls} w-32`}
          type="text"
          placeholder="Header text"
          value={header.content || ''}
          onChange={(e) => updateHeader({ content: e.target.value })}
          disabled={!header.enabled}
        />
        {header.enabled && (
          <ArrowUp {...ico} className="text-gray-400" aria-hidden="true" />
        )}
      </Group>

      <Group title="Footer">
        <label className="inline-flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className={checkboxCls}
            checked={footer.enabled}
            onChange={(e) => updateFooter({ enabled: e.target.checked })}
          />
          On
        </label>
        <NumField
          label="H"
          value={footer.height}
          onChange={(v) => updateFooter({ height: Math.max(0, v) })}
        />
        <input
          className={`${textCls} w-32`}
          type="text"
          placeholder="Footer text"
          value={footer.content || ''}
          onChange={(e) => updateFooter({ content: e.target.value })}
          disabled={!footer.enabled}
        />
        {footer.enabled && (
          <ArrowDown {...ico} className="text-gray-400" aria-hidden="true" />
        )}
      </Group>

      <Group title="Watermark">
        {!watermark ? (
          <button type="button" className={primaryBtn} onClick={addWatermark}>
            <Droplet {...ico} /> Add
          </button>
        ) : (
          <>
            <input
              className={`${textCls} w-40`}
              type="text"
              placeholder="Image URL"
              value={watermark.content || ''}
              onChange={(e) => updateWatermark({ content: e.target.value })}
            />
            <label className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-gray-500">Op</span>
              <input
                className={numCls}
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={watermark.style.opacity ?? 0.15}
                onChange={(e) =>
                  updateWatermarkStyle({
                    opacity: parseFloat(e.target.value) || 0.15,
                  })
                }
              />
            </label>
            <select
              className={selCls}
              value={watermark.style.objectFit || 'cover'}
              onChange={(e) => updateWatermarkStyle({ objectFit: e.target.value })}
              title="Object fit"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
            </select>
            <button
              type="button"
              className={dangerBtn}
              onClick={removeWatermark}
              title="Remove watermark"
            >
              <X {...ico} /> Remove
            </button>
          </>
        )}
      </Group>
    </>
  );
}
