import { newId, defaultLayout, defaultHeader, defaultFooter } from '../document';
import { addElementToPage } from './pageActions';

export function appendPage(doc, sourcePage, pageDefaults) {
  const src = sourcePage || {
    page: { layout: defaultLayout() },
    elements: [],
  };
  const srcPage = src.page || {};
  const watermark = (src.elements || []).filter((el) => el.type === 'watermark');
  return {
    ...doc,
    pages: [
      ...doc.pages,
      {
        page: {
          width: pageDefaults.width,
          height: pageDefaults.height,
          unit: pageDefaults.unit,
          layout: { ...(srcPage.layout || defaultLayout()) },
          header: { ...(srcPage.header || defaultHeader()) },
          footer: { ...(srcPage.footer || defaultFooter()) },
        },
        elements: watermark.map((w) => ({ ...w, id: newId() })),
      },
    ],
  };
}

export function removePageAt(doc, index) {
  return {
    ...doc,
    pages: doc.pages.filter((_, i) => i !== index),
  };
}

export function replaceDoc(doc, nextDoc) {
  return nextDoc;
}

export function addWatermarkToAllPages(doc, factory) {
  return {
    ...doc,
    pages: doc.pages.map((p) => {
      if (p.elements.some((it) => it.type === 'watermark')) return p;
      const el = factory();
      return addElementToPage(p, { ...el, id: newId() });
    }),
  };
}
