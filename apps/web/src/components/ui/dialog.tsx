'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

/**
 * Built on the native <dialog> element, which gives focus trapping, Escape-to-close
 * and correct screen reader semantics for free.
 */
export function Dialog({ open, onClose, title, children, wide }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className={clsx(
        'w-[calc(100%-2rem)] rounded-xl border border-line bg-surface p-0 text-ink shadow-2xl',
        wide ? 'max-w-3xl' : 'max-w-md',
      )}
    >
      {open && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 id="dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-muted hover:bg-line/50 hover:text-ink"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
