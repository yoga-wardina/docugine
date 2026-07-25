import React from 'react';

const inputCls =
  'border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900 bg-white w-full focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20';
const labelCls = 'block font-semibold mb-1.5 text-sm text-gray-700';
const rowCls = 'flex gap-2 mb-2';
const colCls = 'flex-1 flex flex-col';
const colSpanCls = 'text-xs text-gray-500 mb-0.5';
const hintCls = 'text-xs text-gray-500 mb-2.5 leading-snug';
const panelCls = 'bg-white border border-gray-200 rounded-lg p-3 mb-3';
const sectionCls = 'mb-3';
const sizeOptions = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px'];

function ptToClosestPx(pt) {
  const px = pt * (96 / 72);
  return sizeOptions.reduce((a, b) => (Math.abs(parseInt(b) - px) < Math.abs(parseInt(a) - px) ? b : a));
}

export default function PropertyPanel({
  doc,
  setDoc,
  selectedIds,
  setSelectedIds,
  editingId,
  quillRef,
}) {
  const selectedElements = doc.elements.filter((el) =>
    selectedIds.includes(el.id)
  );

  if (selectedIds.length === 0) {
    return (
      <div className={panelCls}>
        <h3 className="mt-0 mb-3 text-base text-gray-900">Properties</h3>
        <p className={hintCls}>Select an element on the page to edit it.</p>
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className={panelCls}>
        <h3 className="mt-0 mb-3 text-base text-gray-900">Properties</h3>
        <p className={hintCls}>{selectedIds.length} elements selected.</p>
        <button
          className="bg-brand-danger text-white border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-brand-dangerDark"
          onClick={() => {
            setDoc((prev) => ({
              ...prev,
              elements: prev.elements.filter(
                (el) => !selectedIds.includes(el.id)
              ),
            }));
            setSelectedIds([]);
          }}
        >
          Delete selected
        </button>
      </div>
    );
  }

  const selectedId = selectedIds[0];
  const element = selectedElements[0];

  function update(patch) {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === selectedId ? { ...el, ...patch } : el
      ),
    }));
  }

  function updateStyle(patch) {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === selectedId ? { ...el, style: { ...el.style, ...patch } } : el
      ),
    }));
  }

  function deleteElement() {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== selectedId),
    }));
    setSelectedIds([]);
  }

  function moveZ(delta) {
    setDoc((prev) => {
      const elements = [...prev.elements];
      const idx = elements.findIndex((el) => el.id === selectedId);
      if (idx === -1) return prev;
      const newIdx = Math.max(0, Math.min(elements.length - 1, idx + delta));
      if (newIdx === idx) return prev;
      const [el] = elements.splice(idx, 1);
      elements.splice(newIdx, 0, el);
      return { ...prev, elements };
    });
  }

  const style = element.style || {};
  const borderSides = style.borderSides || {
    top: true,
    right: true,
    bottom: true,
    left: true,
  };

  function toggleBorderSide(side) {
    updateStyle({
      borderSides: { ...borderSides, [side]: !borderSides[side] },
    });
  }

  // Scope-aware text helpers: apply to Quill selection when the text editor
  // is focused on this element, otherwise to the whole layer (element style).
  const inTextFocus =
    element.type === 'text' &&
    editingId &&
    selectedIds.length === 1 &&
    selectedIds[0] === editingId;

  function getQuillEditor() {
    return quillRef?.current?.getEditor?.();
  }

  function applyToQuill(name, value) {
    const quill = getQuillEditor();
    if (!quill) return false;
    quill.focus();
    quill.format(name, value);
    return true;
  }

  function applyTextProp(name, value) {
    if (inTextFocus && applyToQuill(name, value)) return;
    updateStyle({ [name]: value });
  }

  function applyTextSize(pxValue) {
    if (inTextFocus && applyToQuill('size', pxValue)) return;
    const pt = Math.round(parseFloat(pxValue) * 0.75 * 10) / 10;
    updateStyle({ fontSize: pt });
  }

  function renderBorderEditor() {
    return (
      <>
        <div className={rowCls}>
          <div className={colCls}>
            <span className={colSpanCls}>Border</span>
            <input
              className={inputCls}
              type="number"
              step="0.5"
              min="0"
              value={style.borderWidth || 0}
              onChange={(e) =>
                updateStyle({ borderWidth: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className={colCls}>
            <span className={colSpanCls}>Style</span>
            <select
              className={inputCls}
              value={style.borderStyle || 'solid'}
              onChange={(e) => updateStyle({ borderStyle: e.target.value })}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
        <div className={rowCls}>
          <div className={colCls}>
            <span className={colSpanCls}>Color</span>
            <input
              className="h-9 w-full border border-gray-300 rounded-md"
              type="color"
              value={style.borderColor || '#000000'}
              onChange={(e) => updateStyle({ borderColor: e.target.value })}
            />
          </div>
          <div className={colCls}>
            <span className={colSpanCls}>Sides</span>
            <div className="flex gap-1">
              {['top', 'right', 'bottom', 'left'].map((side) => (
                <button
                  key={side}
                  type="button"
                  className={`flex-1 min-w-[28px] px-1 py-1 text-xs border rounded cursor-pointer ${
                    borderSides[side]
                      ? 'bg-brand-accent border-brand-accent text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-brand-accent'
                  }`}
                  onClick={() => toggleBorderSide(side)}
                  title={`${side} border`}
                >
                  {side[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentSizePx = ptToClosestPx(Number(style.fontSize) || 11);

  return (
    <div className={panelCls}>
      <h3 className="mt-0 mb-3 text-base text-gray-900">Properties</h3>

      <div className={sectionCls}>
        <label className={labelCls}>Size</label>
        <div className={rowCls}>
          <div className={colCls}>
            <span className={colSpanCls}>W (mm)</span>
            <input
              className={inputCls}
              type="number"
              step="0.5"
              value={element.width}
              onChange={(e) => update({ width: parseFloat(e.target.value) || 1 })}
            />
          </div>
          <div className={colCls}>
            <span className={colSpanCls}>H (mm)</span>
            <input
              className={inputCls}
              type="number"
              step="0.5"
              value={element.height}
              onChange={(e) => update({ height: parseFloat(e.target.value) || 1 })}
            />
          </div>
        </div>
        <p className={hintCls}>Drag the element on the canvas to position it.</p>
      </div>

      {element.type === 'text' && (
        <div className={sectionCls}>
          <label className={labelCls}>Content</label>
          <p className={hintCls}>Use {'{{tagName}}'} for merge fields.</p>
          <textarea
            className={inputCls}
            rows={6}
            value={element.content}
            onChange={(e) => update({ content: e.target.value })}
          />

          <div className="flex items-center justify-between mb-1.5 mt-3">
            <label className="text-sm font-semibold text-gray-700">Text</label>
            <span
              className={`text-[0.7rem] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                inTextFocus
                  ? 'bg-blue-50 text-brand-accent border border-blue-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
              title={
                inTextFocus
                  ? 'Changes apply to the current text selection'
                  : 'Changes apply to the whole layer'
              }
            >
              {inTextFocus ? 'Selection' : 'Layer'}
            </span>
          </div>
          <p className={hintCls}>
            {inTextFocus
              ? 'Editing this text — changes affect the selected text. For inline styling (bold, italic, lists) and the full toolbar, use the Format tab.'
              : 'These are the layer-wide defaults. Double-click the text to edit and apply changes to a selection.'}
          </p>

          <div className={rowCls}>
            <div className={colCls}>
              <span className={colSpanCls}>Font</span>
              <input
                className={inputCls}
                type="text"
                value={style.fontFamily || ''}
                placeholder="Arial, sans-serif"
                onChange={(e) => applyTextProp('fontFamily', e.target.value)}
              />
            </div>
            <div className={colCls}>
              <span className={colSpanCls}>Size</span>
              <select
                className={inputCls}
                value={currentSizePx}
                onChange={(e) => applyTextSize(e.target.value)}
              >
                {sizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={rowCls}>
            <div className={colCls}>
              <span className={colSpanCls}>Color</span>
              <input
                className="h-9 w-full border border-gray-300 rounded-md"
                type="color"
                value={style.color || '#111827'}
                onChange={(e) => applyTextProp('color', e.target.value)}
              />
            </div>
            <div className={colCls}>
              <span className={colSpanCls}>Background</span>
              <input
                className="h-9 w-full border border-gray-300 rounded-md"
                type="color"
                value={style.backgroundColor || '#ffffff'}
                onChange={(e) =>
                  applyTextProp('backgroundColor', e.target.value || 'transparent')
                }
              />
            </div>
          </div>

          <div className={rowCls}>
            <div className={colCls}>
              <span className={colSpanCls}>Align</span>
              <select
                className={inputCls}
                value={style.textAlign || 'left'}
                onChange={(e) => applyTextProp('textAlign', e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
            <div className={colCls}>
              <span className={colSpanCls}>Weight</span>
              <select
                className={inputCls}
                value={style.fontWeight || 'normal'}
                onChange={(e) => applyTextProp('fontWeight', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Light</option>
              </select>
            </div>
          </div>

          <label className={labelCls}>Border</label>
          {renderBorderEditor()}
        </div>
      )}

      {element.type === 'rect' && (
        <div className={sectionCls}>
          <label className={labelCls}>Fill</label>
          <div className={rowCls}>
            <div className={colCls}>
              <span className={colSpanCls}>Fill</span>
              <input
                className="h-9 w-full border border-gray-300 rounded-md"
                type="color"
                value={style.backgroundColor || '#f3f4f6'}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
              />
            </div>
            <div className={colCls}>
              <span className={colSpanCls}>Radius</span>
              <input
                className={inputCls}
                type="number"
                step="0.5"
                value={style.borderRadius || 0}
                onChange={(e) => updateStyle({ borderRadius: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <label className={labelCls}>Border</label>
          {renderBorderEditor()}
        </div>
      )}

      {element.type === 'image' && (
        <div className={sectionCls}>
          <label className={labelCls}>Image URL</label>
          <input
            className={inputCls}
            type="text"
            value={element.content}
            placeholder="https://example.com/image.png"
            onChange={(e) => update({ content: e.target.value })}
          />
          <label className={labelCls}>Object fit</label>
          <select
            className={inputCls}
            value={style.objectFit || 'cover'}
            onChange={(e) => updateStyle({ objectFit: e.target.value })}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
            <option value="none">None</option>
          </select>
          <label className={labelCls}>Border</label>
          {renderBorderEditor()}
        </div>
      )}

      {element.type === 'watermark' && (
        <div className={sectionCls}>
          <label className={labelCls}>Watermark image</label>
          <input
            className={inputCls}
            type="text"
            value={element.content}
            placeholder="https://example.com/watermark.png"
            onChange={(e) => update({ content: e.target.value })}
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
                value={style.opacity ?? 0.15}
                onChange={(e) =>
                  updateStyle({ opacity: parseFloat(e.target.value) ?? 0.15 })
                }
              />
            </div>
            <div className={colCls}>
              <span className={colSpanCls}>Object fit</span>
              <select
                className={inputCls}
                value={style.objectFit || 'cover'}
                onChange={(e) => updateStyle({ objectFit: e.target.value })}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {element.type === 'line' && (
        <div className={sectionCls}>
          <label className={labelCls}>Line</label>
          <p className={hintCls}>Width is length, height is thickness.</p>
          <div className={rowCls}>
            <div className={colCls}>
              <span className={colSpanCls}>Color</span>
              <input
                className="h-9 w-full border border-gray-300 rounded-md"
                type="color"
                value={style.lineColor || '#111827'}
                onChange={(e) => updateStyle({ lineColor: e.target.value })}
              />
            </div>
            <div className={colCls}>
              <span className={colSpanCls}>Rotation</span>
              <input
                className={inputCls}
                type="number"
                step="1"
                value={style.rotation || 0}
                onChange={(e) =>
                  updateStyle({ rotation: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </div>
      )}

      <div className={sectionCls}>
        <label className={labelCls}>Arrangement</label>
        <div className={rowCls}>
          <div className={colCls}>
            <span className={colSpanCls}>Opacity</span>
            <input
              className={inputCls}
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={style.opacity ?? 1}
              onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) ?? 1 })}
            />
          </div>
          <div className={colCls}>
            <span className={colSpanCls}>Z-index</span>
            <input
              className={inputCls}
              type="number"
              step="1"
              value={style.zIndex || 0}
              onChange={(e) => updateStyle({ zIndex: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          className="bg-gray-200 text-gray-900 border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-gray-300"
          onClick={() => moveZ(-1)}
        >
          Back
        </button>
        <button
          className="bg-gray-200 text-gray-900 border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-gray-300"
          onClick={() => moveZ(1)}
        >
          Front
        </button>
        <button
          className="bg-brand-danger text-white border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-brand-dangerDark"
          onClick={deleteElement}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
