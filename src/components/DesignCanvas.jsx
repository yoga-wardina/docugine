import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Quill from 'quill';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Tag,
  Eraser,
} from 'lucide-react';
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  MM_TO_PX,
  mergeTags,
  defaultLayout,
  defaultHeader,
  defaultFooter,
} from '../lib/document';
import { getLayerColor } from '../lib/colors';

const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = [
  '8px',
  '9px',
  '10px',
  '11px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '28px',
  '32px',
];
Quill.register(SizeStyle, true);

function toCssStyle(style = {}, type, width, height) {
  const sides = style.borderSides || {
    top: true,
    right: true,
    bottom: true,
    left: true,
  };
  const borderWidthPx = style.borderWidth ? `${style.borderWidth}px` : 0;
  const common = {
    backgroundColor: style.backgroundColor ?? 'transparent',
    borderTopWidth: sides.top ? borderWidthPx : 0,
    borderRightWidth: sides.right ? borderWidthPx : 0,
    borderBottomWidth: sides.bottom ? borderWidthPx : 0,
    borderLeftWidth: sides.left ? borderWidthPx : 0,
    borderColor: style.borderColor ?? '#000000',
    borderStyle: style.borderStyle ?? 'solid',
    borderRadius: style.borderRadius ? `${style.borderRadius}px` : 0,
    boxSizing: 'border-box',
    opacity: style.opacity ?? 1,
    zIndex: style.zIndex ?? 0,
  };

  if (type === 'text') {
    return {
      ...common,
      fontSize: `${style.fontSize ?? 11}pt`,
      color: style.color ?? '#111827',
      fontFamily: style.fontFamily ?? 'Arial, sans-serif',
      fontWeight: style.fontWeight ?? 'normal',
      textAlign: style.textAlign ?? 'left',
      whiteSpace: style.whiteSpace ?? 'normal',
      overflow: 'hidden',
      wordWrap: 'break-word',
    };
  }

  if (type === 'rect') {
    return {
      ...common,
    };
  }

  if (type === 'image') {
    return {
      ...common,
      objectFit: style.objectFit ?? 'cover',
    };
  }

  if (type === 'line') {
    return {
      ...common,
      backgroundColor: style.lineColor ?? '#111827',
      width: `${width}mm`,
      height: `${height}mm`,
      transform: `rotate(${style.rotation ?? 0}deg)`,
      transformOrigin: 'left center',
      overflow: 'visible',
    };
  }

  if (type === 'watermark') {
    return {
      ...common,
      opacity: style.opacity ?? 0.15,
      objectFit: style.objectFit ?? 'cover',
      zIndex: -1,
    };
  }

  return common;
}

function renderTextContent(content, mode, data) {
  let html = content.replace(/\n/g, '<br>');
  if (mode === 'merge') {
    html = mergeTags(html, data);
  } else {
    html = html.replace(
      /(\{\{\s*[^}\s]+\s*\}\})/g,
      '<span class="tag">$1</span>'
    );
  }
  return (
    <div className="text-content w-full h-full" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default function DesignCanvas({
  doc,
  setDoc,
  selectedIds,
  setSelectedIds,
  mode,
  data,
  snapMm = 0,
  zoom = 1,
  setZoom,
  editingId,
  onEditStart,
  stopEditing,
  quillRef,
  showGuides = false,
  showGrid = false,
}) {
  const pageRef = useRef(null);
  const canvasRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const actionRef = useRef(null);

  const naturalWidth = PAGE_WIDTH * MM_TO_PX;
  const naturalHeight = PAGE_HEIGHT * MM_TO_PX;
  const scale = fitScale * zoom;
  const snap = useMemo(
    () => (snapMm > 0 ? (v) => Math.round(v / snapMm) * snapMm : (v) => v),
    [snapMm]
  );

  const layoutConfig = useMemo(() => {
    const layout = doc.page?.layout || defaultLayout();
    const header = doc.page?.header || defaultHeader();
    const footer = doc.page?.footer || defaultFooter();
    const m = layout.margins || {};
    const headerHeight = header.enabled ? header.height || 0 : 0;
    const footerHeight = footer.enabled ? footer.height || 0 : 0;
    return {
      showMargins: layout.showMargins ?? true,
      marginGuideStyle: layout.marginGuideStyle || 'dotted',
      marginGuideColor: layout.marginGuideColor || '#94a3b8',
      strictMargin: layout.strictMargin ?? false,
      snapToMargin: layout.snapToMargin ?? false,
      margins: {
        top: m.top ?? 0,
        right: m.right ?? 0,
        bottom: m.bottom ?? 0,
        left: m.left ?? 0,
      },
      header: {
        enabled: !!header.enabled,
        height: headerHeight,
        content: header.content || '',
      },
      footer: {
        enabled: !!footer.enabled,
        height: footerHeight,
        content: footer.content || '',
      },
    };
  }, [doc.page?.layout, doc.page?.header, doc.page?.footer]);

  useEffect(() => {
    function updateFitScale() {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const s = Math.min(
        rect.width / naturalWidth,
        rect.height / naturalHeight,
        1
      );
      setFitScale(Math.max(s, 0.1));
    }
    updateFitScale();

    const observer = new ResizeObserver(updateFitScale);
    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }
    window.addEventListener('resize', updateFitScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateFitScale);
    };
  }, [naturalWidth, naturalHeight]);

  useEffect(() => {
    function wheel(e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z) => Math.max(0.1, Math.min(5, z + delta)));
      }
    }
    const node = canvasRef.current;
    if (!node) return;
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, [setZoom]);

  useEffect(() => {
    if (!editingId) {
      setEditValue('');
      return;
    }
    const el = doc.elements.find((item) => item.id === editingId);
    if (el) {
      setEditValue(el.content.replace(/\n/g, '<br>'));
    }
    const t = setTimeout(() => {
      quillRef.current?.focus?.();
    }, 0);
    return () => clearTimeout(t);
  }, [editingId, doc.elements, quillRef]);

  const startEditing = useCallback(
    (id) => {
      if (mode !== 'design') return;
      const el = doc.elements.find((item) => item.id === id);
      if (!el || el.type !== 'text') return;
      setSelectedIds([id]);
      onEditStart(id);
      setContextMenu(null);
    },
    [mode, doc.elements, setSelectedIds, onEditStart]
  );

  useEffect(() => {
    if (!contextMenu) return;
    function close(e) {
      if (!e.target.closest('.context-menu')) {
        setContextMenu(null);
      }
    }
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [contextMenu]);

  function eventToMm(e) {
    const rect = pageRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * PAGE_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * PAGE_HEIGHT,
    };
  }

  useEffect(() => {
    const { strictMargin, snapToMargin, margins, header, footer } = layoutConfig;
    const headerGuard = header.enabled ? header.height : 0;
    const footerGuard = footer.enabled ? footer.height : 0;
    const topBound = Math.max(margins.top, headerGuard);
    const bottomBound = Math.max(margins.bottom, footerGuard);
    const SNAP_MARGIN_MM = 2;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function snapToTargets(value, targets) {
      if (!snapToMargin) return value;
      for (const t of targets) {
        if (Math.abs(value - t) <= SNAP_MARGIN_MM) return t;
      }
      return value;
    }

    function applySnap(value, targets) {
      const snapped = snapToTargets(value, targets);
      return { value: snapped, snapped: snapped !== value };
    }

    function move(e) {
      const action = actionRef.current;
      if (!action) return;
      const mm = eventToMm(e);
      const preserveRatio = e.shiftKey && action.type === 'resize';

      if (action.type === 'move') {
        const dx = mm.x - action.startX;
        const dy = mm.y - action.startY;
        setDoc((prev) => {
          const nextElements = prev.elements.map((item) => {
            const start = action.initialPositions.find((p) => p.id === item.id);
            if (!start) return item;
            const isWatermark = item.type === 'watermark';
            const bypass = isWatermark || !!item.bypassStrictMargin;
            const useMargin = !bypass;
            const minX = useMargin && strictMargin ? margins.left : 0;
            const maxX =
              PAGE_WIDTH -
              (useMargin && strictMargin ? margins.right : 0) -
              start.width;
            const minY = useMargin && strictMargin ? topBound : 0;
            const maxY =
              PAGE_HEIGHT -
              (useMargin && strictMargin ? bottomBound : 0) -
              start.height;

            const rawX = clamp(start.x + dx, minX, maxX);
            const rawY = clamp(start.y + dy, minY, maxY);

            const xTargets = useMargin
              ? [margins.left, PAGE_WIDTH - margins.right - start.width]
              : [];
            const yTargets = useMargin
              ? [topBound, PAGE_HEIGHT - bottomBound - start.height]
              : [];

            const xRes = applySnap(rawX, xTargets);
            const yRes = applySnap(rawY, yTargets);

            let nextX = xRes.snapped ? xRes.value : snap(rawX);
            let nextY = yRes.snapped ? yRes.value : snap(rawY);

            if (useMargin && strictMargin) {
              nextX = clamp(nextX, minX, maxX);
              nextY = clamp(nextY, minY, maxY);
            }

            return { ...item, x: nextX, y: nextY };
          });
          return { ...prev, elements: nextElements };
        });
      } else if (action.type === 'resize') {
        const dx = mm.x - action.startX;
        const dy = mm.y - action.startY;
        setDoc((prev) => {
          const el = prev.elements.find((item) => item.id === action.id);
          if (!el) return prev;
          const MIN_W = 5;
          const MIN_H = 5;
          const { handle, initialX, initialY, initialW, initialH } = action;
          const isWatermark = el.type === 'watermark';
          const bypass = isWatermark || !!el.bypassStrictMargin;
          const useMargin = !bypass;

          let width =
            initialW +
            (handle.includes('e') ? dx : 0) -
            (handle.includes('w') ? dx : 0);
          let height =
            initialH +
            (handle.includes('s') ? dy : 0) -
            (handle.includes('n') ? dy : 0);

          if (preserveRatio && initialW > 0 && initialH > 0) {
            const scaleW = width / initialW;
            const scaleH = height / initialH;
            const scale = Math.max(scaleW, scaleH);
            width = initialW * scale;
            height = initialH * scale;
            if (width < MIN_W) {
              width = MIN_W;
              height = (MIN_W * initialH) / initialW;
            }
            if (height < MIN_H) {
              height = MIN_H;
              width = (MIN_H * initialW) / initialH;
            }
          } else {
            if (width < MIN_W) width = MIN_W;
            if (height < MIN_H) height = MIN_H;
          }

          let x = handle.includes('w') ? initialX + initialW - width : initialX;
          let y = handle.includes('n') ? initialY + initialH - height : initialY;

          const minX = useMargin && strictMargin ? margins.left : 0;
          const minY = useMargin && strictMargin ? topBound : 0;
          const maxX = PAGE_WIDTH - (useMargin && strictMargin ? margins.right : 0);
          const maxY = PAGE_HEIGHT - (useMargin && strictMargin ? bottomBound : 0);

          x = clamp(x, minX, maxX - width);
          y = clamp(y, minY, maxY - height);
          width = clamp(width, MIN_W, maxX - x);
          height = clamp(height, MIN_H, maxY - y);

          let nextX = x;
          let nextY = y;
          let nextW = width;
          let nextH = height;

          if (!preserveRatio) {
            const xTargets = useMargin ? [margins.left] : [];
            const yTargets = useMargin ? [topBound] : [];
            const widthTargets = useMargin
              ? [PAGE_WIDTH - margins.right - x]
              : [];
            const heightTargets = useMargin
              ? [PAGE_HEIGHT - bottomBound - y]
              : [];

            const xRes = applySnap(x, xTargets);
            const yRes = applySnap(y, yTargets);
            const widthRes = applySnap(width, widthTargets);
            const heightRes = applySnap(height, heightTargets);

            nextX = xRes.snapped ? xRes.value : snap(x);
            nextY = yRes.snapped ? yRes.value : snap(y);
            nextW = widthRes.snapped ? widthRes.value : snap(width);
            nextH = heightRes.snapped ? heightRes.value : snap(height);

            if (useMargin && strictMargin) {
              nextX = clamp(nextX, minX, maxX - nextW);
              nextY = clamp(nextY, minY, maxY - nextH);
              nextW = clamp(nextW, MIN_W, maxX - nextX);
              nextH = clamp(nextH, MIN_H, maxY - nextY);
            }
          }

          return {
            ...prev,
            elements: prev.elements.map((item) =>
              item.id === action.id
                ? {
                    ...item,
                    x: nextX,
                    y: nextY,
                    width: nextW,
                    height: nextH,
                  }
                : item
            ),
          };
        });
      }
    }

    function up() {
      actionRef.current = null;
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [setDoc, snap, layoutConfig]);

  function handlePagePointerDown(e) {
    if (e.target !== pageRef.current) return;
    setContextMenu(null);
    if (!e.shiftKey) {
      setSelectedIds([]);
    }
  }

  function handleElementPointerDown(e, id) {
    if (mode !== 'design') return;
    if (editingId === id) return;
    e.stopPropagation();
    e.preventDefault();
    setContextMenu(null);

    const el = doc.elements.find((item) => item.id === id);
    if (!el) return;

    if (e.shiftKey) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      return;
    }

    if (!selectedIds.includes(id)) {
      setSelectedIds([id]);
    }

    const mm = eventToMm(e);
    const idsToMove = e.shiftKey ? [] : selectedIds.includes(id) ? selectedIds : [id];
    const initialPositions = doc.elements
      .filter((item) => idsToMove.includes(item.id))
      .map((item) => ({
        id: item.id,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      }));

    actionRef.current = {
      type: 'move',
      ids: idsToMove,
      startX: mm.x,
      startY: mm.y,
      initialPositions,
    };
  }

  function handleResizePointerDown(e, id, handle) {
    if (mode !== 'design') return;
    e.stopPropagation();
    e.preventDefault();
    setContextMenu(null);

    const el = doc.elements.find((item) => item.id === id);
    if (!el) return;

    setSelectedIds([id]);
    const mm = eventToMm(e);
    actionRef.current = {
      type: 'resize',
      id,
      handle,
      startX: mm.x,
      startY: mm.y,
      initialX: el.x,
      initialY: el.y,
      initialW: el.width,
      initialH: el.height,
    };
  }

  function getQuill() {
    return quillRef.current?.getEditor?.();
  }

  function format(name, value) {
    const quill = getQuill();
    if (!quill) return;
    quill.focus();
    quill.format(name, value);
  }

  function toggleFormat(name) {
    const quill = getQuill();
    if (!quill) return;
    quill.focus();
    const current = quill.getFormat();
    quill.format(name, !current[name]);
  }

  function insertTag() {
    const quill = getQuill();
    if (!quill) return;
    quill.focus();
    const selection = quill.getSelection();
    const index = selection ? selection.index : quill.getLength();
    quill.insertText(index, '{{tag}}');
    quill.setSelection(index + 7, 0);
  }

  function clearFormatting() {
    const quill = getQuill();
    if (!quill) return;
    quill.focus();
    const selection = quill.getSelection();
    if (selection && selection.length > 0) {
      quill.removeFormat(selection.index, selection.length);
    } else {
      const length = quill.getLength();
      quill.removeFormat(0, length);
    }
  }

  function runMenu(action) {
    action();
    setContextMenu(null);
  }

  function ContextMenu() {
    if (!contextMenu) return null;
    const x = Math.min(contextMenu.x, PAGE_WIDTH - 35);
    const y = Math.min(contextMenu.y, PAGE_HEIGHT - 55);
    const ic = { size: 14, strokeWidth: 2 };
    const itemCls =
      'flex items-center gap-2 bg-transparent text-white border-none rounded px-2 py-1 text-left text-sm cursor-pointer hover:bg-gray-700 w-full';
    return (
      <div
        className="absolute min-w-[35mm] bg-gray-900 rounded-lg p-1.5 flex flex-col gap-0.5 z-[100] shadow-2xl"
        style={{ left: `${x}mm`, top: `${y}mm` }}
        onPointerDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="text-[0.7rem] uppercase tracking-wider text-gray-400 px-2 py-1">
          Format selection
        </div>
        <button type="button" className={itemCls} onClick={() => runMenu(() => toggleFormat('bold'))}>
          <Bold {...ic} /> Bold
        </button>
        <button type="button" className={itemCls} onClick={() => runMenu(() => toggleFormat('italic'))}>
          <Italic {...ic} /> Italic
        </button>
        <button type="button" className={itemCls} onClick={() => runMenu(() => toggleFormat('underline'))}>
          <Underline {...ic} /> Underline
        </button>
        <button type="button" className={itemCls} onClick={() => runMenu(() => format('align', 'left'))}>
          <AlignLeft {...ic} /> Align left
        </button>
        <button type="button" className={itemCls} onClick={() => runMenu(() => format('align', 'center'))}>
          <AlignCenter {...ic} /> Center
        </button>
        <button type="button" className={itemCls} onClick={() => runMenu(() => format('align', 'right'))}>
          <AlignRight {...ic} /> Align right
        </button>
        <label className="flex items-center justify-between text-white text-sm px-2 py-1 cursor-pointer hover:bg-gray-700 rounded">
          Text color
          <input
            type="color"
            className="h-5 w-7 border-none bg-transparent"
            onChange={(e) => runMenu(() => format('color', e.target.value))}
          />
        </label>
        <label className="flex items-center justify-between text-white text-sm px-2 py-1 cursor-pointer hover:bg-gray-700 rounded">
          Size
          <select
            className="bg-gray-800 text-white border border-gray-600 rounded px-1 py-0.5 text-xs"
            value=""
            onChange={(e) => runMenu(() => format('size', e.target.value))}
          >
            <option value="" disabled>
              Size
            </option>
            <option value="8px">8px</option>
            <option value="9px">9px</option>
            <option value="10px">10px</option>
            <option value="11px">11px</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="22px">22px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
          </select>
        </label>
        <button type="button" className={itemCls} onClick={() => runMenu(insertTag)}>
          <Tag {...ic} /> Insert {'{{tag}}'}
        </button>
        <button type="button" className={itemCls} onClick={() => runMenu(clearFormatting)}>
          <Eraser {...ic} /> Clear formatting
        </button>
      </div>
    );
  }

  const wrapperStyle = {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };

  const pageStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  };

  const marginGuideCss =
    layoutConfig.marginGuideStyle === 'stripped'
      ? {
          border: '1px solid transparent',
          borderImage: `repeating-linear-gradient(45deg, ${layoutConfig.marginGuideColor} 0, ${layoutConfig.marginGuideColor} 2px, transparent 2px, transparent 4px) 1`,
        }
      : {
          border: `1px ${layoutConfig.marginGuideStyle === 'dotted' ? 'dotted' : 'solid'} ${layoutConfig.marginGuideColor}`,
        };

  const watermarks = doc.elements.filter((el) => !el.hidden && el.type === 'watermark');
  const others = doc.elements.filter((el) => !el.hidden && el.type !== 'watermark');

  function renderElement(el) {
    const isSelected = selectedIds.includes(el.id) && mode === 'design';
    const isSingleSelected =
      selectedIds.length === 1 && selectedIds[0] === el.id && mode === 'design';
    const css = toCssStyle(el.style, el.type, el.width, el.height);
    const position = {
      left: `${el.x}mm`,
      top: `${el.y}mm`,
      width: `${el.width}mm`,
      height: `${el.height}mm`,
    };

    const isEditing = editingId === el.id;

    return (
      <div
        key={el.id}
        className={`absolute select-none cursor-move box-border overflow-hidden ${
          isSelected ? 'outline outline-2 outline-brand-accent' : ''
        } ${el.type === 'text' ? 'block leading-tight' : ''}`}
        style={{ ...css, ...position }}
        onPointerDown={(e) => handleElementPointerDown(e, el.id)}
        onDoubleClick={(e) => {
          if (mode === 'design' && el.type === 'text') {
            e.stopPropagation();
            startEditing(el.id);
          }
        }}
      >
        {isEditing ? (
          <div
            className="absolute inset-0 w-full h-full bg-white/95 overflow-auto cursor-text whitespace-normal"
            onPointerDown={(e) => {
              e.stopPropagation();
              setContextMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const mm = eventToMm(e);
              setContextMenu({ x: mm.x, y: mm.y });
            }}
            style={{ ...css }}
          >
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={editValue}
              onChange={setEditValue}
              onBlur={() => stopEditing(true)}
              modules={{ toolbar: false }}
              formats={[
                'bold',
                'italic',
                'underline',
                'strike',
                'color',
                'background',
                'align',
                'size',
                'header',
                'list',
                'indent',
                'blockquote',
              ]}
              style={{ height: '100%' }}
            />
          </div>
        ) : (
          el.type === 'text' && renderTextContent(el.content, mode, data)
        )}
        {el.type === 'rect' && (
          <div className="w-full h-full" style={{ background: css.backgroundColor }} />
        )}
        {(el.type === 'image' || el.type === 'watermark') && (
          <img
            src={mergeTags(el.content, data)}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: css.objectFit || 'cover' }}
          />
        )}
        {el.type === 'line' && (
          <div
            className="w-full h-full"
            style={{ background: css.backgroundColor }}
          />
        )}
        {isSingleSelected && !isEditing && (
          <>
            <div
              className="absolute w-2.5 h-2.5 bg-white border border-brand-accent -top-1.5 -left-1.5 cursor-nwse-resize z-10"
              onPointerDown={(e) => handleResizePointerDown(e, el.id, 'nw')}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-white border border-brand-accent left-1/2 -translate-x-1/2 -top-1.5 cursor-ns-resize z-10"
              onPointerDown={(e) => handleResizePointerDown(e, el.id, 'n')}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-white border border-brand-accent -top-1.5 -right-1.5 cursor-nesw-resize z-10"
              onPointerDown={(e) => handleResizePointerDown(e, el.id, 'ne')}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-white border border-brand-accent top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize z-10"
              onPointerDown={(e) => handleResizePointerDown(e, el.id, 'e')}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-white border border-brand-accent -bottom-1.5 -right-1.5 cursor-nwse-resize z-10"
              onPointerDown={(e) => handleResizePointerDown(e, el.id, 'se')}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-white border border-brand-accent left-1/2 -translate-x-1/2 -bottom-1.5 cursor-ns-resize z-10"
              onPointerDown={(e) => handleResizePointerDown(e, el.id, 's')}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-white border border-brand-accent -bottom-1.5 -left-1.5 cursor-nesw-resize z-10"
              onPointerDown={(e) => handleResizePointerDown(e, el.id, 'sw')}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-white border border-brand-accent top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize z-10"
              onPointerDown={(e) => handleResizePointerDown(e, el.id, 'w')}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={canvasRef} className="min-h-full flex relative">
      <div className="relative my-auto mx-auto flex-shrink-0" style={wrapperStyle}>
        <div
          ref={pageRef}
          className="w-[210mm] h-[297mm] bg-white shadow-xl relative overflow-hidden origin-top-left z-0"
          style={pageStyle}
          onPointerDown={handlePagePointerDown}
        >
          {watermarks.map(renderElement)}
          {mode === 'design' && showGrid && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)',
                backgroundSize: `${snapMm > 0 ? snapMm : 5}mm ${snapMm > 0 ? snapMm : 5}mm`,
              }}
            />
          )}
          {mode === 'design' && layoutConfig.showMargins && (
            <div
              className="absolute pointer-events-none z-0 box-border"
              style={{
                top: `${layoutConfig.margins.top}mm`,
                left: `${layoutConfig.margins.left}mm`,
                right: `${layoutConfig.margins.right}mm`,
                bottom: `${layoutConfig.margins.bottom}mm`,
                ...marginGuideCss,
              }}
            />
          )}
          {layoutConfig.header.enabled && (
            <div
              className="absolute pointer-events-none z-[1] box-border overflow-hidden flex items-end"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: `${layoutConfig.header.height}mm`,
                padding: `${Math.min(2, layoutConfig.header.height / 4)}mm ${layoutConfig.margins.left}mm`,
                background: mode === 'design' ? 'rgba(140, 43, 238, 0.04)' : 'transparent',
                borderBottom:
                  mode === 'design'
                    ? `1.5px ${layoutConfig.marginGuideStyle === 'dotted' ? 'dotted' : 'solid'} ${layoutConfig.marginGuideColor}`
                    : 'none',
              }}
            >
              <div
                className={`truncate w-full ${mode === 'design' ? 'text-[0.6rem] uppercase tracking-wider' : 'text-sm text-gray-900'}`}
                style={
                  mode === 'design'
                    ? { color: layoutConfig.marginGuideColor }
                    : undefined
                }
              >
                {layoutConfig.header.content || (mode === 'design' ? 'Header' : '')}
              </div>
            </div>
          )}
          {layoutConfig.footer.enabled && (
            <div
              className="absolute pointer-events-none z-[1] box-border overflow-hidden flex items-start"
              style={{
                bottom: 0,
                left: 0,
                right: 0,
                height: `${layoutConfig.footer.height}mm`,
                padding: `${Math.min(2, layoutConfig.footer.height / 4)}mm ${layoutConfig.margins.left}mm`,
                background: mode === 'design' ? 'rgba(140, 43, 238, 0.04)' : 'transparent',
                borderTop:
                  mode === 'design'
                    ? `1.5px ${layoutConfig.marginGuideStyle === 'dotted' ? 'dotted' : 'solid'} ${layoutConfig.marginGuideColor}`
                    : 'none',
              }}
            >
              <div
                className={`truncate w-full ${mode === 'design' ? 'text-[0.6rem] uppercase tracking-wider' : 'text-sm text-gray-900'}`}
                style={
                  mode === 'design'
                    ? { color: layoutConfig.marginGuideColor }
                    : undefined
                }
              >
                {layoutConfig.footer.content || (mode === 'design' ? 'Footer' : '')}
              </div>
            </div>
          )}
          {others.map(renderElement)}
          {mode === 'design' && showGuides &&
            others.map((el) => (
              <div
                key={`guide-${el.id}`}
                className="absolute pointer-events-none z-[50] opacity-60 box-border rounded-sm"
                style={{
                  left: `${el.x}mm`,
                  top: `${el.y}mm`,
                  width: `${el.width}mm`,
                  height: `${el.height}mm`,
                  border: `1.5px dashed ${getLayerColor(el.id)}`,
                }}
              />
            ))}
          <ContextMenu />
        </div>
      </div>
    </div>
  );
}
