import { defaultHeader, defaultFooter } from '../document';

export function nextInsertOffset(page) {
  return 20 + (page.elements.length % 5) * 5;
}

export function addElementToPage(page, element) {
  return { ...page, elements: [...page.elements, element] };
}

export function addElementsToPage(page, elements) {
  return { ...page, elements: [...page.elements, ...elements] };
}

export function patchLayout(page, patch) {
  const currentLayout = page.page?.layout || {};
  return {
    ...page,
    page: { ...page.page, layout: { ...currentLayout, ...patch } },
  };
}

export function patchMargins(page, patch) {
  const currentLayout = page.page?.layout || {};
  const currentMargins = currentLayout.margins || {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  const next = { ...currentMargins, ...patch };
  const header = page.page?.header || defaultHeader();
  const footer = page.page?.footer || defaultFooter();
  if (header.enabled && patch.top !== undefined) {
    next.top = Math.max(patch.top, header.height || 0);
  }
  if (footer.enabled && patch.bottom !== undefined) {
    next.bottom = Math.max(patch.bottom, footer.height || 0);
  }
  return {
    ...page,
    page: {
      ...page.page,
      layout: { ...currentLayout, margins: next },
    },
  };
}

export function patchHeader(page, patch) {
  const currentHeader = page.page?.header || defaultHeader();
  const nextHeader = { ...currentHeader, ...patch };
  const currentLayout = page.page?.layout || {};
  const currentFooter = page.page?.footer || defaultFooter();
  let nextLayout = currentLayout;
  if (nextHeader.enabled) {
    const need = nextHeader.height || 0;
    if ((currentLayout.margins?.top ?? 0) < need) {
      nextLayout = {
        ...currentLayout,
        margins: {
          ...(currentLayout.margins || {}),
          top: need,
        },
      };
    }
  }
  return {
    ...page,
    page: {
      ...page.page,
      header: nextHeader,
      layout: nextLayout,
      footer: currentFooter,
    },
  };
}

export function patchFooter(page, patch) {
  const currentFooter = page.page?.footer || defaultFooter();
  const nextFooter = { ...currentFooter, ...patch };
  const currentLayout = page.page?.layout || {};
  const currentHeader = page.page?.header || defaultHeader();
  let nextLayout = currentLayout;
  if (nextFooter.enabled) {
    const need = nextFooter.height || 0;
    if ((currentLayout.margins?.bottom ?? 0) < need) {
      nextLayout = {
        ...currentLayout,
        margins: {
          ...(currentLayout.margins || {}),
          bottom: need,
        },
      };
    }
  }
  return {
    ...page,
    page: {
      ...page.page,
      footer: nextFooter,
      layout: nextLayout,
      header: currentHeader,
    },
  };
}

export function removeWatermarkFromPage(page) {
  return {
    ...page,
    elements: page.elements.filter((el) => el.type !== 'watermark'),
  };
}

export function patchWatermarkOnPage(page, patch) {
  return {
    ...page,
    elements: page.elements.map((el) =>
      el.type === 'watermark' ? { ...el, ...patch } : el
    ),
  };
}

export function patchWatermarkStyleOnPage(page, stylePatch) {
  return {
    ...page,
    elements: page.elements.map((el) =>
      el.type === 'watermark'
        ? { ...el, style: { ...(el.style || {}), ...stylePatch } }
        : el
    ),
  };
}
