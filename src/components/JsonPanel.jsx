import React, { useEffect, useState } from 'react';
import { exportDocument, importDocument } from '../utils/document';

export default function JsonPanel({ doc, setDoc }) {
  const [text, setText] = useState(() => exportDocument(doc));

  useEffect(() => {
    setText(exportDocument(doc));
  }, [doc]);

  function load() {
    try {
      const parsed = importDocument(text);
      setDoc(parsed);
      alert('Template loaded from JSON.');
    } catch (err) {
      alert(`Invalid JSON: ${err.message}`);
    }
  }

  function exportToFile() {
    const blob = new Blob([exportDocument(doc)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copy() {
    navigator.clipboard.writeText(exportDocument(doc)).then(() => {
      alert('JSON copied to clipboard.');
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <h3 className="mt-0 mb-3 text-base text-gray-900">Template JSON</h3>
      <p className="text-xs text-gray-500 mb-2.5 leading-snug">
        This is the saved document. Edit the JSON and click Load, or copy it
        to reuse the template later.
      </p>
      <textarea
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900 bg-white font-mono leading-snug focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
        rows={18}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2 mt-3">
        <button
          className="bg-brand-accent text-white border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-brand-accentDark"
          onClick={load}
        >
          Load JSON
        </button>
        <button
          className="bg-gray-200 text-gray-900 border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-gray-300"
          onClick={copy}
        >
          Copy
        </button>
        <button
          className="bg-gray-200 text-gray-900 border-none rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-gray-300"
          onClick={exportToFile}
        >
          Download
        </button>
      </div>
    </div>
  );
}
