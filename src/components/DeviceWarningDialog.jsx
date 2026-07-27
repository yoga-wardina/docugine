import React, { useEffect, useRef, useState } from 'react';
import { Mouse, Keyboard, Smartphone } from 'lucide-react';

const overlayCls =
  'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm';
const cardCls =
  'bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-gray-900';

export default function DeviceWarningDialog({
  open,
  onDismiss,
  title = 'For the best experience',
  message = 'Docugine is designed for a mouse and keyboard. You can keep going on this device, but precision editing, drag-to-resize, and the rich-text toolbar are easier with a pointer.',
}) {
  const [checked, setChecked] = useState(false);
  const continueRef = useRef(null);

  useEffect(() => {
    if (open) {
      setChecked(false);
      const t = setTimeout(() => continueRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') return;
      if (e.key === 'Enter' && checked) {
        e.preventDefault();
        onDismiss();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, checked, onDismiss]);

  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-warning-title"
      aria-describedby="device-warning-desc"
    >
      <div className={cardCls}>
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-brand-accent">
            <Mouse size={20} />
          </span>
          <h2 id="device-warning-title" className="m-0 text-lg font-semibold">
            {title}
          </h2>
        </div>

        <p id="device-warning-desc" className="text-sm text-gray-600 mb-4 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-center gap-4 mb-4 text-gray-500">
          <span className="inline-flex items-center gap-1.5 text-xs">
            <Mouse size={14} /> Mouse
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <Keyboard size={14} /> Keyboard
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Smartphone size={14} /> Not ideal
          </span>
        </div>

        <label className="flex items-start gap-2 mb-4 cursor-pointer rounded p-2 -ml-2 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-brand-accent cursor-pointer touch-manipulation"
          />
          <span className="text-sm text-gray-700 select-none">
            I understand, and don&rsquo;t show this again on this device.
          </span>
        </label>

        <button
          ref={continueRef}
          type="button"
          disabled={!checked}
          onClick={onDismiss}
          className="w-full bg-brand-accent text-white border-none rounded-md py-2 text-sm font-medium cursor-pointer hover:bg-brand-accentDark disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
