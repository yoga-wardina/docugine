export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const PAGE_UNIT = 'mm';
export const MM_TO_PX = 96 / 25.4;

export function defaultLayout() {
  return {
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    marginGuideStyle: 'dotted',
    marginGuideColor: '#94a3b8',
    showMargins: true,
    strictMargin: false,
    snapToMargin: false,
  };
}

function newPage(elements = []) {
  return {
    page: {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      unit: PAGE_UNIT,
      layout: defaultLayout(),
    },
    elements,
  };
}

export function defaultDocument() {
  return {
    pages: [
      newPage([
        {
          id: 'title',
          type: 'text',
          x: 20,
          y: 20,
          width: 170,
          height: 18,
          content: 'Invoice {{invoiceNumber}}',
          style: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#111827',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
          },
        },
        {
          id: 'date',
          type: 'text',
          x: 20,
          y: 44,
          width: 170,
          height: 10,
          content: 'Date: {{date}}',
          style: {
            fontSize: 12,
            color: '#374151',
            textAlign: 'right',
            fontFamily: 'Arial, sans-serif',
          },
        },
        {
          id: 'customer',
          type: 'text',
          x: 20,
          y: 62,
          width: 85,
          height: 35,
          content: 'Bill to:\n{{customerName}}\n{{customerAddress}}',
          style: {
            fontSize: 11,
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif',
            whiteSpace: 'pre-wrap',
          },
        },
        {
          id: 'box',
          type: 'rect',
          x: 20,
          y: 110,
          width: 170,
          height: 80,
          content: '',
          style: {
            backgroundColor: '#f3f4f6',
            borderColor: '#9ca3af',
            borderWidth: 1,
            borderStyle: 'solid',
          },
        },
        {
          id: 'total',
          type: 'text',
          x: 130,
          y: 200,
          width: 60,
          height: 12,
          content: 'Total: {{total}}',
          style: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#111827',
            textAlign: 'right',
            fontFamily: 'Arial, sans-serif',
          },
        },
      ]),
    ],
  };
}

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newElement(type, x = 20, y = 20) {
  const base = {
    id: newId(),
    type,
    x,
    y,
    width: 60,
    height: 12,
    content: '',
    style: {},
  };

  if (type === 'text') {
    base.width = 80;
    base.height = 12;
    base.content = '{{tag}}';
    base.style = {
      fontSize: 11,
      color: '#111827',
      textAlign: 'left',
      fontFamily: 'Arial, sans-serif',
      whiteSpace: 'pre-wrap',
    };
  } else if (type === 'rect') {
    base.width = 60;
    base.height = 40;
    base.style = {
      backgroundColor: '#f3f4f6',
      borderColor: '#9ca3af',
      borderWidth: 1,
      borderStyle: 'solid',
    };
  } else if (type === 'image') {
    base.width = 50;
    base.height = 50;
    base.content = 'https://via.placeholder.com/200';
    base.style = {};
  } else if (type === 'line') {
    base.width = 80;
    base.height = 1;
    base.content = '';
    base.style = {
      lineColor: '#111827',
      rotation: 0,
    };
  }

  return base;
}

export function newHeadingElement(x = 20, y = 20) {
  return {
    id: newId(),
    type: 'text',
    x,
    y,
    width: 170,
    height: 16,
    content: 'Heading',
    style: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#111827',
      textAlign: 'left',
      fontFamily: 'Arial, sans-serif',
    },
  };
}

export function newWatermarkElement(x = 50, y = 100) {
  return {
    id: newId(),
    type: 'watermark',
    x,
    y,
    width: 100,
    height: 100,
    content: 'https://via.placeholder.com/400',
    style: {
      opacity: 0.15,
      objectFit: 'cover',
    },
  };
}

export function newSignatureTemplate(x = 20, y = 20) {
  const line = {
    id: newId(),
    type: 'line',
    x,
    y: y + 8,
    width: 70,
    height: 0.8,
    content: '',
    style: {
      lineColor: '#111827',
      rotation: 0,
    },
  };
  const label = {
    id: newId(),
    type: 'text',
    x,
    y,
    width: 70,
    height: 8,
    content: 'Signature',
    style: {
      fontSize: 10,
      color: '#6b7280',
      textAlign: 'left',
      fontFamily: 'Arial, sans-serif',
    },
  };
  return [label, line];
}

export function mergeTags(content, data = {}) {
  if (typeof content !== 'string') return content;
  return content.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(data, key) ? String(data[key]) : '';
  });
}

export function findTags(content) {
  if (typeof content !== 'string') return [];
  const matches = content.match(/\{\{\s*([^}\s]+)\s*\}\}/g);
  return matches ? matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()) : [];
}

export function exportDocument(doc) {
  return JSON.stringify(doc, null, 2);
}

function normalizePage(raw, index) {
  const page = raw.page || {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    unit: PAGE_UNIT,
  };
  if (!page.layout) {
    page.layout = defaultLayout();
  }
  if (page.layout.strictMargin === undefined) page.layout.strictMargin = false;
  if (page.layout.snapToMargin === undefined) page.layout.snapToMargin = false;
  return {
    page,
    elements: (raw.elements || []).map((el, i) => ({
      id: el.id || `${Date.now()}-${index}-${i}`,
      type: el.type || 'text',
      x: Number(el.x ?? 0),
      y: Number(el.y ?? 0),
      width: Number(el.width ?? 20),
      height: Number(el.height ?? 10),
      content: el.content ?? '',
      style: el.style || {},
    })),
  };
}

export function importDocument(json) {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid document JSON');
  }

  if (Array.isArray(parsed.pages)) {
    return { pages: parsed.pages.map((p, i) => normalizePage(p, i)) };
  }

  if (Array.isArray(parsed.elements)) {
    return { pages: [normalizePage(parsed, 0)] };
  }

  throw new Error('Document must have a pages array or a single elements array');
}
