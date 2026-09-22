import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`fixed inset-0 z-[100] w-full ${maxWidth} rounded-md border border-border bg-white p-0 shadow-lg backdrop:bg-black/30`}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-navy">{title}</h2>
        <button
          onClick={onClose}
          className="text-mid hover:text-navy transition-colors text-lg leading-none"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
