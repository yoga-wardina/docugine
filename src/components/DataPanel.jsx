import React, { useState, useEffect } from 'react';
import { findTags } from '../lib/document';

export default function DataPanel({ doc, data, setData }) {
  const [text, setText] = useState(() => JSON.stringify(data, null, 2));

  useEffect(() => {
    setText(JSON.stringify(data, null, 2));
  }, [data]);

  function handleChange(e) {
    setText(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setData(parsed);
      }
    } catch {
      // ignore invalid JSON while typing
    }
  }

  const allTags = Array.from(
    new Set(
      (doc.pages || []).flatMap((page) =>
        page.elements.flatMap((el) => findTags(el.content))
      )
    )
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <h3 className="mt-0 mb-3 text-base text-gray-900">Merge Data</h3>
      <p className="text-xs text-gray-500 mb-2.5 leading-snug">
        Enter a JSON object. Keys are matched against the{' '}
        <code>{'{{tag}}'}</code> placeholders in your template.
      </p>

      <textarea
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900 bg-white font-mono leading-snug focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
        rows={14}
        value={text}
        onChange={handleChange}
      />

      <div className="mb-3 mt-3">
        <label className="block font-semibold mb-1.5 text-sm text-gray-700">Detected tags</label>
        {allTags.length === 0 ? (
          <p className="text-xs text-gray-500 mb-2.5 leading-snug">No tags found in the template.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-50 text-brand-accent border border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
