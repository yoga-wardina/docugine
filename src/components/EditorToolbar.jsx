import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  PaintBucket,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered,
  List,
  IndentIncrease,
  IndentDecrease,
  Quote,
  Check,
} from 'lucide-react';

const btnCls =
  'inline-flex items-center justify-center h-[26px] px-2 bg-white text-gray-900 border border-gray-300 rounded text-xs cursor-pointer leading-none hover:bg-gray-100 min-w-[26px]';
const selCls =
  'h-[26px] px-2 bg-white text-gray-900 border border-gray-300 rounded text-xs cursor-pointer hover:bg-gray-100';
const colorBtnCls =
  'relative inline-flex items-center justify-center overflow-hidden w-[26px] h-[26px] p-0 bg-white text-gray-900 border border-gray-300 rounded cursor-pointer';
const ico = { size: 14, strokeWidth: 2 };

export function getQuill(quillRef) {
  return quillRef?.current?.getEditor?.();
}

export function formatText(quillRef, name, value) {
  const quill = getQuill(quillRef);
  if (!quill) return;
  quill.focus();
  quill.format(name, value);
}

export function toggleFormatText(quillRef, name) {
  const quill = getQuill(quillRef);
  if (!quill) return;
  quill.focus();
  const current = quill.getFormat();
  quill.format(name, !current[name]);
}

export function toggleListText(quillRef, kind) {
  const quill = getQuill(quillRef);
  if (!quill) return;
  quill.focus();
  const current = quill.getFormat();
  quill.format('list', current.list === kind ? false : kind);
}

export function changeIndentText(quillRef, delta) {
  const quill = getQuill(quillRef);
  if (!quill) return;
  quill.focus();
  const current = Number(quill.getFormat().indent || 0);
  quill.format('indent', Math.max(0, current + delta));
}

export function toggleBlockquoteText(quillRef) {
  const quill = getQuill(quillRef);
  if (!quill) return;
  quill.focus();
  const current = quill.getFormat();
  quill.format('blockquote', current.blockquote ? false : true);
}

export function insertTagText(quillRef) {
  const quill = getQuill(quillRef);
  if (!quill) return;
  quill.focus();
  const selection = quill.getSelection();
  const index = selection ? selection.index : quill.getLength();
  quill.insertText(index, '{{tag}}');
  quill.setSelection(index + 7, 0);
}

export function StylingButtons({ quillRef }) {
  return (
    <>
      <button type="button" className={btnCls} onClick={() => toggleFormatText(quillRef, 'bold')} title="Bold">
        <Bold {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => toggleFormatText(quillRef, 'italic')} title="Italic">
        <Italic {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => toggleFormatText(quillRef, 'underline')} title="Underline">
        <Underline {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => toggleFormatText(quillRef, 'strike')} title="Strikethrough">
        <Strikethrough {...ico} />
      </button>
      <label className={colorBtnCls} title="Text color">
        <input
          type="color"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-none"
          onChange={(e) => formatText(quillRef, 'color', e.target.value)}
        />
        <Type {...ico} />
      </label>
      <label className={colorBtnCls} title="Background color">
        <input
          type="color"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-none"
          onChange={(e) => formatText(quillRef, 'background', e.target.value)}
        />
        <PaintBucket {...ico} />
      </label>
    </>
  );
}

export function AlignmentButtons({ quillRef }) {
  return (
    <>
      <button type="button" className={btnCls} onClick={() => formatText(quillRef, 'align', 'left')} title="Align left">
        <AlignLeft {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => formatText(quillRef, 'align', 'center')} title="Center">
        <AlignCenter {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => formatText(quillRef, 'align', 'right')} title="Align right">
        <AlignRight {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => formatText(quillRef, 'align', 'justify')} title="Justify">
        <AlignJustify {...ico} />
      </button>
    </>
  );
}

export function ListButtons({ quillRef }) {
  return (
    <>
      <button type="button" className={btnCls} onClick={() => toggleListText(quillRef, 'ordered')} title="Ordered list">
        <ListOrdered {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => toggleListText(quillRef, 'bullet')} title="Bullet list">
        <List {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => changeIndentText(quillRef, +1)} title="Increase indent">
        <IndentIncrease {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => changeIndentText(quillRef, -1)} title="Decrease indent">
        <IndentDecrease {...ico} />
      </button>
      <button type="button" className={btnCls} onClick={() => toggleBlockquoteText(quillRef)} title="Blockquote">
        <Quote {...ico} />
      </button>
    </>
  );
}

export function TextButtons({ quillRef, onDone }) {
  return (
    <>
      <select
        className={selCls}
        defaultValue=""
        onChange={(e) => {
          formatText(quillRef, 'header', e.target.value ? Number(e.target.value) : false);
          e.target.value = '';
        }}
        title="Heading"
      >
        <option value="" disabled>
          Heading
        </option>
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
        <option value="">Normal</option>
      </select>
      <select
        className={selCls}
        defaultValue=""
        onChange={(e) => {
          formatText(quillRef, 'size', e.target.value);
          e.target.value = '';
        }}
        title="Font size"
      >
        <option value="" disabled>
          Size
        </option>
        <option value="8px">8px</option>
        <option value="9px">9px</option>
        <option value="10px">10px</option>
        <option value="11px">11px</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="22px">22px</option>
        <option value="24px">24px</option>
        <option value="28px">28px</option>
        <option value="32px">32px</option>
      </select>
      <button
        type="button"
        className={btnCls}
        onClick={() => insertTagText(quillRef)}
        title="Insert tag"
      >
        {'{{Tags}}'}
      </button>
      <button
        type="button"
        className={`${btnCls} bg-brand-accent text-white border-brand-accent hover:bg-brand-accentDark hover:border-brand-accentDark gap-1`}
        onClick={onDone}
      >
        <Check {...ico} />
        Done
      </button>
    </>
  );
}
