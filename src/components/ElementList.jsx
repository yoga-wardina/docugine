import React, { useState } from 'react';
import { Eye, EyeOff, ListChecks } from 'lucide-react';

const rowCls =
  'flex items-center gap-2 px-2 py-2 text-sm border-b border-gray-100 cursor-pointer last:border-b-0 select-none touch-manipulation min-h-[44px]';
const ico = { size: 14, strokeWidth: 2 };

export default function ElementList({
  doc,
  actions,
  selectedIds,
  setSelectedIds,
}) {
  const [multiSelect, setMultiSelect] = useState(false);

  function handleSelect(id, e) {
    const additive = multiSelect || e?.shiftKey || e?.metaKey || e?.ctrlKey;
    if (additive) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h3 className="m-0 text-base text-gray-900">Layers</h3>
        <button
          type="button"
          onClick={() => setMultiSelect((v) => !v)}
          aria-pressed={multiSelect}
          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded cursor-pointer touch-manipulation min-h-[32px] border ${
            multiSelect
              ? 'bg-brand-accent text-white border-brand-accentDark'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
          title={
            multiSelect
              ? 'Exit multi-select (tap to toggle each item)'
              : 'Enter multi-select (tap to toggle each item)'
          }
        >
          <ListChecks {...ico} /> {multiSelect ? 'Multi · on' : 'Multi'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-2.5 leading-snug">
        {multiSelect
          ? 'Tap items to add or remove them from the selection.'
          : 'Tap an item to select it. Tap “Multi” to pick several.'}
      </p>
      {doc.elements.length === 0 ? (
        <p className="text-xs text-gray-500 mb-2.5 leading-snug">
          No elements yet. Add one from the toolbar.
        </p>
      ) : (
        <ul className="list-none p-0 m-0" role="listbox" aria-multiselectable={multiSelect}>
          {doc.elements.map((el) => {
            const selected = selectedIds.includes(el.id);
            return (
              <li
                key={el.id}
                role="option"
                aria-selected={selected}
                tabIndex={0}
                className={`${rowCls} ${
                  selected
                    ? 'bg-brand-accent/15 text-brand-accent font-semibold border-l-2 border-brand-accent pl-[6px]'
                    : 'hover:bg-gray-100 active:bg-gray-200 border-l-2 border-transparent pl-[6px]'
                } ${el.hidden ? 'opacity-50' : ''}`}
                onClick={(e) => handleSelect(el.id, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(el.id, e);
                  }
                }}
              >
                <span
                  aria-hidden="true"
                  className={`flex items-center justify-center w-5 h-5 rounded border ${
                    selected
                      ? 'bg-brand-accent border-brand-accentDark text-white'
                      : 'bg-white border-gray-300'
                  } ${multiSelect ? '' : 'opacity-60'}`}
                >
                  {selected && (
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 8 7 12 13 4" />
                    </svg>
                  )}
                </span>
                <span className="text-[0.7rem] uppercase text-gray-500 min-w-[60px]">
                  {el.type}
                </span>
                <span className="flex-1 truncate">
                  {el.content
                    ? String(el.content).replace(/<[^>]+>/g, ' ').slice(0, 20)
                    : el.id.slice(0, 8)}
                </span>
                <button
                  type="button"
                  aria-label={el.hidden ? 'Show layer' : 'Hide layer'}
                  className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 bg-transparent border-none rounded cursor-pointer touch-manipulation p-2 -mr-2 min-w-[40px] min-h-[40px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.toggleHidden(el.id);
                  }}
                >
                  {el.hidden ? <Eye {...ico} /> : <EyeOff {...ico} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
