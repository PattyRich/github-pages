import { useEffect, useRef } from 'react';
import Button from './Button';
import './ModalShell.css';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isVisibleFocusable(element) {
  const style = window.getComputedStyle(element);
  return (
    !element.hidden &&
    element.getAttribute('type') !== 'hidden' &&
    style.display !== 'none' &&
    style.visibility !== 'hidden'
  );
}

export function ModalShell({
  show = true,
  title,
  titleId,
  onClose,
  children,
  footer,
  maxWidth = '620px',
  className = '',
  bodyClassName = '',
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    const previouslyFocused = document.activeElement;

    const focusModal = () => {
      const focusable = Array.from(
        panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []
      ).find(isVisibleFocusable);
      (focusable || panelRef.current)?.focus();
    };

    focusModal();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) {
        return;
      }

      const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        isVisibleFocusable
      );

      if (!focusable.length) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="osrs-modal-backdrop" onMouseDown={onClose}>
      <div
        ref={panelRef}
        className={`osrs-modal-panel osrs-glass-raised ${className}`.trim()}
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="osrs-modal-header">
          <div id={titleId} className="osrs-modal-title osrs-header">
            {title}
          </div>
          <button className="osrs-modal-close" type="button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className={`osrs-modal-body ${bodyClassName}`.trim()}>{children}</div>

        {footer && <div className="osrs-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ModalButton({ variant = 'primary', size, className = '', children, ...props }) {
  const classes = [
    'osrs-modal-btn',
    `osrs-modal-btn--${variant}`,
    size ? `osrs-modal-btn--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Button variant={variant} size={size} className={classes} {...props}>
      {children}
    </Button>
  );
}
