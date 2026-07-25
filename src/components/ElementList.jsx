import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function ElementList({
  doc,
  setDoc,
  selectedIds,
  setSelectedIds,
}) {
  function toggleVisibility(id) {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, hidden: !el.hidden } : el
      ),
    }));
  }

  function handleClick(e, id) {
    if (e.shiftKey) {
      e.preventDefault();
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <h3 className="mt-0 mb-3 text-base text-gray-900">Layers</h3>
      <p className="text-xs text-gray-500 mb-2.5 leading-snug">Shift+click to multi-select.</p>
      {doc.elements.length === 0 ? (
        <p className="text-xs text-gray-500 mb-2.5 leading-snug">No elements yet. Add one from the toolbar.</p>
      ) : (
        <ul className="list-none p-0 m-0">
          {doc.elements.map((el, idx) => (
            <li
              key={el.id}
              className={`flex items-center gap-2 px-2 py-1.5 text-sm border-b border-gray-100 cursor-pointer last:border-b-0 ${
                selectedIds.includes(el.id)
                  ? 'bg-blue-50 text-brand-accent font-semibold'
                  : 'hover:bg-gray-100'
              } ${el.hidden ? 'opacity-50' : ''}`}
              onClick={(e) => handleClick(e, el.id)}
            >
              <span className="text-[0.7rem] uppercase text-gray-500 min-w-[60px]">{el.type}</span>
              <span className="flex-1 truncate">
                {el.content ? String(el.content).slice(0, 20) : el.id.slice(0, 8)}
              </span>
              <button
                className="bg-transparent border-none cursor-pointer p-0 leading-none text-gray-600 hover:text-gray-900"
                title={el.hidden ? 'Show' : 'Hide'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(el.id);
                }}
              >
                {el.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
