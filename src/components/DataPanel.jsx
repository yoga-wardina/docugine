import React from 'react';
import { findTags } from '../lib/document';

const inputCls =
  'border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900 bg-white w-full focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20';
const labelCls = 'block font-semibold mb-1 text-xs text-gray-700';
const hintCls = 'text-xs text-gray-500 mb-2.5 leading-snug';
const panelCls = 'bg-white border border-gray-200 rounded-lg p-3 mb-3';

export default function DataPanel({ doc, data, setData }) {
  const allTags = Array.from(
    new Set(
      (doc.pages || []).flatMap((page) =>
        page.elements.flatMap((el) => findTags(el.content))
      )
    )
  );

  function updateTag(tag, value) {
    setData((prev) => ({ ...(prev || {}), [tag]: value }));
  }

  return (
    <div className={panelCls}>
      <h3 className="mt-0 mb-3 text-base text-gray-900">Merge Data</h3>
      <p className={hintCls}>
        Use these inputs to preview the final document structure. Each field
        matches a <code className="font-mono text-[0.7rem] bg-gray-100 px-1 py-0.5 rounded">{'{{tag}}'}</code> placeholder found in the template.
      </p>

      {allTags.length === 0 ? (
        <p className="text-xs text-gray-500">
          No tags found in the template yet. Add{' '}
          <code className="font-mono text-[0.7rem] bg-gray-100 px-1 py-0.5 rounded">
            {'{{tagName}}'}
          </code>{' '}
          placeholders inside any text element to see them here.
        </p>
      ) : (
        <div className="space-y-2.5">
          {allTags.map((tag) => (
            <div key={tag}>
              <label className={labelCls}>
                <span className="font-mono text-brand-accent">
                  {`{{${tag}}}`}
                </span>
              </label>
              <input
                className={inputCls}
                type="text"
                value={data?.[tag] ?? ''}
                placeholder={`Value for {{${tag}}}`}
                onChange={(e) => updateTag(tag, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
