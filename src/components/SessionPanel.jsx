import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Camera,
  Trash2,
  Pencil,
  History,
  RotateCcw,
} from 'lucide-react';

const panelCls =
  'bg-white border border-gray-200 rounded-lg p-3 mb-3';
const btnCls =
  'inline-flex items-center justify-center gap-1 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer leading-none hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-w-[28px]';
const btnPrimaryCls =
  'inline-flex items-center justify-center gap-1 bg-brand-accent text-white border border-brand-accentDark rounded px-2 py-1 text-xs cursor-pointer leading-none hover:bg-brand-accentDark min-w-[28px]';
const btnDangerCls =
  'inline-flex items-center justify-center gap-1 bg-brand-danger text-white border border-brand-dangerDark rounded px-2 py-1 text-xs cursor-pointer leading-none hover:bg-brand-dangerDark min-w-[28px]';
const ico = { size: 13, strokeWidth: 2 };

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SessionPanel({
  sessions,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  onDelete,
  onRename,
  historyDepth,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');

  function startRename(s) {
    setEditingId(s.id);
    setDraftName(s.name);
  }

  function commitRename() {
    if (editingId && draftName.trim()) {
      onRename(editingId, draftName.trim());
    }
    setEditingId(null);
    setDraftName('');
  }

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="m-0 text-base text-gray-900 flex items-center gap-1.5">
          <History {...ico} /> History
        </h3>
        <span className="text-[0.7rem] text-gray-500">{historyDepth} nodes</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <button
          type="button"
          className={btnCls}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 {...ico} /> Undo
        </button>
        <button
          type="button"
          className={btnCls}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 {...ico} /> Redo
        </button>
        <button
          type="button"
          className={btnPrimaryCls}
          onClick={onSave}
          title="Save snapshot (Ctrl+S)"
        >
          <Camera {...ico} /> Snapshot
        </button>
      </div>

      <div className="text-[0.7rem] uppercase tracking-wider text-gray-500 mb-1.5">
        Snapshots
      </div>
      {sessions.length === 0 ? (
        <p className="text-xs text-gray-500 m-0">
          No saved snapshots. Press <strong>Snapshot</strong> or <kbd>Ctrl+S</kbd> to save the current state.
        </p>
      ) : (
        <ul className="list-none p-0 m-0 max-h-48 overflow-y-auto">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-1.5 px-1.5 py-1 text-xs border-b border-gray-100 last:border-b-0"
            >
              {editingId === s.id ? (
                <input
                  autoFocus
                  className="flex-1 border border-brand-accent rounded px-1 py-0.5 text-xs"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setDraftName('');
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="flex-1 text-left bg-transparent border-none cursor-pointer p-0 text-gray-900 hover:text-brand-accent truncate"
                  title={`Load ${s.name}`}
                  onClick={() => onLoad(s.id)}
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="block text-[0.65rem] text-gray-500">
                    {formatTime(s.updatedAt)}
                  </span>
                </button>
              )}
              <button
                type="button"
                className={btnCls}
                title="Rename"
                onClick={() => startRename(s)}
              >
                <Pencil {...ico} />
              </button>
              <button
                type="button"
                className={btnDangerCls}
                title="Delete"
                onClick={() => {
                  if (window.confirm(`Delete snapshot "${s.name}"?`)) onDelete(s.id);
                }}
              >
                <Trash2 {...ico} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[0.65rem] text-gray-500 mt-2 m-0 leading-snug">
        <RotateCcw {...ico} className="inline" /> Stored locally. Up to{' '}
        {sessions.length === 0 ? '10' : sessions.length} snapshots kept.
      </p>
    </div>
  );
}
