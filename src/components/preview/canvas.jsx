import React, { useEffect } from 'react';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MM_TO_PX = 96 / 25.4;

const CSS_PREFIX = 'dpg';
const CSS_TEXT = `
  .${CSS_PREFIX}-text-content { font-size: inherit; line-height: 1.4; }
  .${CSS_PREFIX}-text-content p { margin: 0; }
  .${CSS_PREFIX}-text-content h1,
  .${CSS_PREFIX}-text-content h2,
  .${CSS_PREFIX}-text-content h3 { margin: 0; font-weight: bold; }
  .${CSS_PREFIX}-text-content ol,
  .${CSS_PREFIX}-text-content ul {
    margin: 0;
    padding-left: 1.25em;
    list-style-position: inside;
  }
  .${CSS_PREFIX}-text-content ol { list-style-type: decimal; }
  .${CSS_PREFIX}-text-content ul { list-style-type: disc; }
  .${CSS_PREFIX}-text-content li { margin: 0; padding: 0; display: list-item; }
  .${CSS_PREFIX}-text-content blockquote {
    margin: 0;
    padding-left: 0.75em;
    border-left: 3px solid #d1d5db;
    color: #4b5563;
  }
`;

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.setAttribute('data-docugine-preview', '');
  el.textContent = CSS_TEXT;
  document.head.appendChild(el);
  stylesInjected = true;
}

function mergeTags(content, data) {
  if (typeof content !== 'string') return content;
  return content.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(data, key) ? String(data[key]) : '';
  });
}

function defaultLayout() {
  return {
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    marginGuideStyle: 'dotted',
    marginGuideColor: '#94a3b8',
    showMargins: true,
  };
}

function defaultHeader() {
  return { enabled: false, height: 12, content: '', style: {} };
}

function defaultFooter() {
  return { enabled: false, height: 12, content: '', style: {} };
}

function toCssStyle(style, type, width, height) {
  const s = style || {};
  const sides = s.borderSides || { top: true, right: true, bottom: true, left: true };
  const borderWidthPx = s.borderWidth ? `${s.borderWidth}px` : 0;
  const common = {
    backgroundColor: s.backgroundColor ?? 'transparent',
    borderTopWidth: sides.top ? borderWidthPx : 0,
    borderRightWidth: sides.right ? borderWidthPx : 0,
    borderBottomWidth: sides.bottom ? borderWidthPx : 0,
    borderLeftWidth: sides.left ? borderWidthPx : 0,
    borderColor: s.borderColor ?? '#000000',
    borderStyle: s.borderStyle ?? 'solid',
    borderRadius: s.borderRadius ? `${s.borderRadius}px` : 0,
    boxSizing: 'border-box',
    opacity: s.opacity ?? 1,
    zIndex: s.zIndex ?? 0,
    overflow: 'hidden',
    wordWrap: 'break-word',
  };
  if (type === 'text') {
    return {
      ...common,
      fontSize: `${s.fontSize ?? 11}pt`,
      color: s.color ?? '#111827',
      fontFamily: s.fontFamily ?? 'Arial, sans-serif',
      fontWeight: s.fontWeight ?? 'normal',
      textAlign: s.textAlign ?? 'left',
      whiteSpace: s.whiteSpace ?? 'normal',
    };
  }
  if (type === 'rect') return common;
  if (type === 'image' || type === 'watermark') {
    return { ...common, objectFit: s.objectFit ?? 'cover' };
  }
  if (type === 'line') {
    return {
      ...common,
      backgroundColor: s.lineColor ?? '#111827',
      width: `${width}px`,
      height: `${height}px`,
      transform: `rotate(${s.rotation ?? 0}deg)`,
      transformOrigin: 'left center',
      overflow: 'visible',
    };
  }
  return common;
}

function renderTextContent(content, data) {
  const html = mergeTags(content, data).replace(/\n/g, '<br>');
  return (
    <div
      className={`${CSS_PREFIX}-text-content`}
      style={{ width: '100%', height: '100%' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderElement(el, data, zoom) {
  const css = toCssStyle(el.style, el.type, el.width, el.height);
  const position = {
    position: 'absolute',
    left: `${el.x * MM_TO_PX * zoom}px`,
    top: `${el.y * MM_TO_PX * zoom}px`,
    width: `${el.width * MM_TO_PX * zoom}px`,
    height: `${el.height * MM_TO_PX * zoom}px`,
  };

  if (el.type === 'text') {
    return (
      <div key={el.id} style={{ ...css, ...position }}>
        {renderTextContent(el.content, data)}
      </div>
    );
  }
  if (el.type === 'rect') {
    return (
      <div
        key={el.id}
        style={{
          ...css,
          ...position,
          width: '100%',
          height: '100%',
          background: css.backgroundColor,
        }}
      />
    );
  }
  if (el.type === 'image' || el.type === 'watermark') {
    return (
      <img
        key={el.id}
        src={mergeTags(el.content, data)}
        alt=""
        draggable={false}
        style={{
          ...css,
          ...position,
          width: '100%',
          height: '100%',
          objectFit: css.objectFit || 'cover',
        }}
      />
    );
  }
  if (el.type === 'line') {
    return (
      <div
        key={el.id}
        style={{ ...css, ...position, background: css.backgroundColor }}
      />
    );
  }
  return null;
}

function renderBand(content, data, style, zoom, side) {
  const merged = mergeTags(content || '', data);
  return (
    <div
      style={{
        fontSize: `${(style && style.fontSize) || 10}pt`,
        color: (style && style.color) || '#374151',
        fontFamily: (style && style.fontFamily) || 'Arial, sans-serif',
        fontWeight: (style && style.fontWeight) || 'normal',
        textAlign: (style && style.textAlign) || (side === 'top' ? 'center' : 'center'),
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
      }}
    >
      {merged}
    </div>
  );
}

function PagePreview({ page, data, metadata }) {
  const layout = page.layout || defaultLayout();
  const header = page.header || defaultHeader();
  const footer = page.footer || defaultFooter();
  const elements = page.elements || [];
  const { showMargins, showHeaderFooter, zoom, pageShadow } = metadata;

  const width = PAGE_WIDTH * MM_TO_PX * zoom;
  const height = PAGE_HEIGHT * MM_TO_PX * zoom;
  const margins = layout.margins || defaultLayout().margins;
  const headerHeight = header.enabled ? header.height : 0;
  const footerHeight = footer.enabled ? footer.height : 0;

  const visibleOthers = elements.filter(
    (el) => el.type !== 'watermark' && !el.hidden
  );
  const visibleWatermarks = elements.filter(
    (el) => el.type === 'watermark' && !el.hidden
  );

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#ffffff',
        boxShadow: pageShadow ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {visibleWatermarks.map((el) => renderElement(el, data, zoom))}

      {showHeaderFooter && header.enabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${headerHeight * MM_TO_PX * zoom}px`,
            padding: `${Math.min(2, headerHeight / 4) * MM_TO_PX * zoom}px ${
              (margins.left || 0) * MM_TO_PX * zoom
            }px`,
            display: 'flex',
            alignItems: 'flex-end',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {renderBand(header.content, data, header.style, zoom, 'top')}
        </div>
      )}

      {showHeaderFooter && footer.enabled && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${footerHeight * MM_TO_PX * zoom}px`,
            padding: `${Math.min(2, footerHeight / 4) * MM_TO_PX * zoom}px ${
              (margins.left || 0) * MM_TO_PX * zoom
            }px`,
            display: 'flex',
            alignItems: 'flex-start',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {renderBand(footer.content, data, footer.style, zoom, 'bottom')}
        </div>
      )}

      {showMargins && layout.showMargins && (
        <div
          style={{
            position: 'absolute',
            top: `${(margins.top || 0) * MM_TO_PX * zoom}px`,
            left: `${(margins.left || 0) * MM_TO_PX * zoom}px`,
            right: `${(margins.right || 0) * MM_TO_PX * zoom}px`,
            bottom: `${(margins.bottom || 0) * MM_TO_PX * zoom}px`,
            border: `1px ${
              layout.marginGuideStyle === 'dotted' ? 'dotted' : 'solid'
            } ${layout.marginGuideColor || '#94a3b8'}`,
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {visibleOthers.map((el) => renderElement(el, data, zoom))}
    </div>
  );
}

function resolveMetadata(metadata) {
  const m = metadata || {};
  return {
    showMargins: m.showMargins !== false,
    showHeaderFooter: m.showHeaderFooter !== false,
    showWatermark: m.showWatermark !== false,
    zoom: typeof m.zoom === 'number' && m.zoom > 0 ? m.zoom : 1,
    pageSpacing: typeof m.pageSpacing === 'number' ? m.pageSpacing : 16,
    pageShadow: m.pageShadow !== false,
    backgroundColor: m.backgroundColor || '#e5e7eb',
    fitToWidth: m.fitToWidth === true,
    containerWidth: typeof m.containerWidth === 'number' ? m.containerWidth : null,
  };
}

export default function PreviewCanvas({
  document,
  data,
  metadata,
  className,
  style,
}) {
  useEffect(() => {
    ensureStyles();
  }, []);

  const safeData = data && typeof data === 'object' ? data : {};
  const meta = resolveMetadata(metadata);

  if (!document || !Array.isArray(document.pages) || document.pages.length === 0) {
    return null;
  }

  const pageMetadata = {
    showMargins: meta.showMargins,
    showHeaderFooter: meta.showHeaderFooter,
    zoom: meta.zoom,
    pageShadow: meta.pageShadow,
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: meta.backgroundColor,
        padding: `${meta.pageSpacing}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      {document.pages.map((page, idx) => (
        <div
          key={page.id || idx}
          style={{
            marginBottom:
              idx < document.pages.length - 1 ? `${meta.pageSpacing}px` : 0,
          }}
        >
          <PagePreview page={page} data={safeData} metadata={pageMetadata} />
        </div>
      ))}
    </div>
  );
}
