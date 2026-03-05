import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, center = false, noClickOutside = false }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape' && onClose) onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`modal-overlay${center ? ' modal-center' : ''}`}
      onClick={e => { if (e.target === e.currentTarget && !noClickOutside && onClose) onClose(); }}
    >
      <div className="modal-sheet">
        {!center && <div className="sheet-grip"><span /></div>}
        {title && (
          <div className="sheet-hdr">
            <span className="sheet-title">{title}</span>
            {onClose && <button className="sheet-close" onClick={onClose}>✕</button>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
