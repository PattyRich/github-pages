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

let activeModalLocks = 0;
let lockedScrollY = 0;
let previousBodyStyles = null;
let previousDocumentStyles = null;

function isVisibleFocusable(element) {
  const style = window.getComputedStyle(element);
  return (
    !element.hidden &&
    element.getAttribute('type') !== 'hidden' &&
    style.display !== 'none' &&
    style.visibility !== 'hidden'
  );
}

function lockDocumentScroll() {
  activeModalLocks += 1;
  if (activeModalLocks > 1) return;

  const { body, documentElement } = document;
  lockedScrollY = window.scrollY || documentElement.scrollTop || 0;
  previousBodyStyles = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };
  previousDocumentStyles = {
    overflow: documentElement.style.overflow,
  };

  documentElement.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${lockedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
}

function unlockDocumentScroll() {
  activeModalLocks = Math.max(0, activeModalLocks - 1);
  if (activeModalLocks > 0) return;

  const { body, documentElement } = document;
  if (previousBodyStyles) {
    body.style.overflow = previousBodyStyles.overflow;
    body.style.position = previousBodyStyles.position;
    body.style.top = previousBodyStyles.top;
    body.style.left = previousBodyStyles.left;
    body.style.right = previousBodyStyles.right;
    body.style.width = previousBodyStyles.width;
  }
  if (previousDocumentStyles) {
    documentElement.style.overflow = previousDocumentStyles.overflow;
  }

  try {
    window.scrollTo(0, lockedScrollY);
  } catch {
    documentElement.scrollTop = lockedScrollY;
    body.scrollTop = lockedScrollY;
  }
  previousBodyStyles = null;
  previousDocumentStyles = null;
  lockedScrollY = 0;
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
    lockDocumentScroll();

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
      unlockDocumentScroll();
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
