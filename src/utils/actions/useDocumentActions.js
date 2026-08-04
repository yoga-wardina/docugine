import { useCallback } from 'react';
import {
  newElement,
  newHeadingElement,
  newSignatureTemplate,
  newWatermarkElement,
  defaultDocument,
  defaultLayout,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_UNIT,
} from '../document';
import { createHistory, saveHistory } from '../history';
import {
  patchElement,
  patchElementStyle,
  deleteElement,
  deleteElements,
  moveElementZ,
  toggleElementHidden,
  toggleBorderSide,
} from './elementActions';
import {
  nextInsertOffset,
  addElementToPage,
  addElementsToPage,
  patchLayout,
  patchMargins,
  patchHeader,
  patchFooter,
  removeWatermarkFromPage,
  patchWatermarkOnPage,
  patchWatermarkStyleOnPage,
} from './pageActions';
import {
  appendPage,
  removePageAt,
  replaceDoc,
} from './docActions';

const PAGE_DEFAULTS = {
  width: PAGE_WIDTH,
  height: PAGE_HEIGHT,
  unit: PAGE_UNIT,
};

export function useDocumentActions({
  setDoc,
  setPageDoc,
  setAllPagesDoc,
  currentPage,
  pageDoc,
  setSelectedIds,
  setMode,
  setCurrentPage,
  setZoom,
  historyRef,
  applyingHistoryRef,
  bumpHistory,
  defaults,
}) {
  const patchElementOnPage = useCallback(
    (id, patch) => {
      setPageDoc((prev) => ({
        ...prev,
        elements: patchElement(prev.elements, id, patch),
      }));
    },
    [setPageDoc]
  );

  const patchElementStyleOnPage = useCallback(
    (id, stylePatch) => {
      setPageDoc((prev) => ({
        ...prev,
        elements: patchElementStyle(prev.elements, id, stylePatch),
      }));
    },
    [setPageDoc]
  );

  const deleteElementFromPage = useCallback(
    (id) => {
      setPageDoc((prev) => ({
        ...prev,
        elements: deleteElement(prev.elements, id),
      }));
      setSelectedIds([]);
    },
    [setPageDoc, setSelectedIds]
  );

  const deleteSelectedFromPage = useCallback(
    (ids) => {
      setPageDoc((prev) => ({
        ...prev,
        elements: deleteElements(prev.elements, ids),
      }));
      setSelectedIds([]);
    },
    [setPageDoc, setSelectedIds]
  );

  const moveZOnPage = useCallback(
    (id, delta) => {
      setPageDoc((prev) => ({
        ...prev,
        elements: moveElementZ(prev.elements, id, delta),
      }));
    },
    [setPageDoc]
  );

  const toggleHiddenOnPage = useCallback(
    (id) => {
      setPageDoc((prev) => ({
        ...prev,
        elements: toggleElementHidden(prev.elements, id),
      }));
    },
    [setPageDoc]
  );

  const toggleBorderSideOnPage = useCallback(
    (id, side, currentSides) => {
      setPageDoc((prev) => ({
        ...prev,
        elements: toggleBorderSide(prev.elements, id, side, currentSides),
      }));
    },
    [setPageDoc]
  );

  const addElement = useCallback(
    (type) => {
      if (!pageDoc) return;
      const offset = nextInsertOffset(pageDoc);
      const el = newElement(type, offset, offset);
      setPageDoc((prev) => addElementToPage(prev, el));
      setSelectedIds([el.id]);
      setMode('design');
    },
    [pageDoc, setPageDoc, setSelectedIds, setMode]
  );

  const addHeading = useCallback(() => {
    if (!pageDoc) return;
    const offset = nextInsertOffset(pageDoc);
    const el = newHeadingElement(offset, offset);
    setPageDoc((prev) => addElementToPage(prev, el));
    setSelectedIds([el.id]);
    setMode('design');
  }, [pageDoc, setPageDoc, setSelectedIds, setMode]);

  const addSignature = useCallback(() => {
    if (!pageDoc) return;
    const offset = nextInsertOffset(pageDoc);
    const elements = newSignatureTemplate(offset, offset + 8);
    setPageDoc((prev) => addElementsToPage(prev, elements));
    setSelectedIds(elements.map((el) => el.id));
    setMode('design');
  }, [pageDoc, setPageDoc, setSelectedIds, setMode]);

  const addWatermark = useCallback(() => {
    const el = newWatermarkElement(55, 100);
    setAllPagesDoc((prev) => {
      if (prev.elements.some((it) => it.type === 'watermark')) return prev;
      return { ...prev, elements: [...prev.elements, el] };
    });
    setSelectedIds([el.id]);
    setMode('design');
  }, [setAllPagesDoc, setSelectedIds, setMode]);

  const patchLayoutAll = useCallback(
    (patch) => {
      setAllPagesDoc((prev) => patchLayout(prev, patch));
    },
    [setAllPagesDoc]
  );

  const patchMarginsAll = useCallback(
    (patch) => {
      setAllPagesDoc((prev) => patchMargins(prev, patch));
    },
    [setAllPagesDoc]
  );

  const patchHeaderAll = useCallback(
    (patch) => {
      setAllPagesDoc((prev) => patchHeader(prev, patch));
    },
    [setAllPagesDoc]
  );

  const patchFooterAll = useCallback(
    (patch) => {
      setAllPagesDoc((prev) => patchFooter(prev, patch));
    },
    [setAllPagesDoc]
  );

  const removeWatermarkAll = useCallback(() => {
    setAllPagesDoc((prev) => removeWatermarkFromPage(prev));
    setSelectedIds([]);
  }, [setAllPagesDoc, setSelectedIds]);

  const patchWatermarkAll = useCallback(
    (patch) => {
      setAllPagesDoc((prev) => patchWatermarkOnPage(prev, patch));
    },
    [setAllPagesDoc]
  );

  const patchWatermarkStyleAll = useCallback(
    (stylePatch) => {
      setAllPagesDoc((prev) => patchWatermarkStyleOnPage(prev, stylePatch));
    },
    [setAllPagesDoc]
  );

  const addPage = useCallback(() => {
    setDoc((prev) => {
      const src = prev.pages[currentPage] || {
        page: { layout: defaultLayout() },
        elements: [],
      };
      return appendPage(prev, src, PAGE_DEFAULTS);
    });
    setCurrentPage((prev) => prev + 1);
    setSelectedIds([]);
    setMode('design');
  }, [setDoc, currentPage, setCurrentPage, setSelectedIds, setMode]);

  const deletePage = useCallback(() => {
    setDoc((prev) => removePageAt(prev, currentPage));
    setCurrentPage((prev) => Math.max(0, prev - 1));
    setSelectedIds([]);
  }, [setDoc, currentPage, setCurrentPage, setSelectedIds]);

  const loadTemplate = useCallback(
    (template) => {
      setDoc(replaceDoc(null, template.factory()));
      setCurrentPage(0);
      setSelectedIds([]);
      setMode('design');
      setZoom(1);
    },
    [setDoc, setCurrentPage, setSelectedIds, setMode, setZoom]
  );

  const resetTemplate = useCallback(() => {
    const fresh = defaultDocument();
    applyingHistoryRef.current = true;
    setDoc(fresh);
    historyRef.current = createHistory(fresh, {
      maxNodes: defaults.history.maxNodes,
    });
    saveHistory(historyRef.current);
    setCurrentPage(0);
    setSelectedIds([]);
    setZoom(1);
    bumpHistory();
    Promise.resolve().then(() => {
      applyingHistoryRef.current = false;
    });
  }, [
    setDoc,
    historyRef,
    applyingHistoryRef,
    setCurrentPage,
    setSelectedIds,
    setZoom,
    bumpHistory,
    defaults.history.maxNodes,
  ]);

  return {
    patchElement: patchElementOnPage,
    patchElementStyle: patchElementStyleOnPage,
    deleteElement: deleteElementFromPage,
    deleteSelected: deleteSelectedFromPage,
    moveZ: moveZOnPage,
    toggleHidden: toggleHiddenOnPage,
    toggleBorderSide: toggleBorderSideOnPage,
    addElement,
    addHeading,
    addSignature,
    addWatermark,
    patchLayout: patchLayoutAll,
    patchMargins: patchMarginsAll,
    patchHeader: patchHeaderAll,
    patchFooter: patchFooterAll,
    removeWatermark: removeWatermarkAll,
    patchWatermark: patchWatermarkAll,
    patchWatermarkStyle: patchWatermarkStyleAll,
    addPage,
    deletePage,
    loadTemplate,
    resetTemplate,
  };
}
