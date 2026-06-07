import { useEffect } from 'react';
import './ModalShell.css';

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
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="osrs-modal-backdrop" onMouseDown={onClose}>
      <div
        className={`osrs-modal-panel osrs-glass-raised ${className}`.trim()}
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
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
    'osrs-btn',
    'osrs-modal-btn',
    `osrs-modal-btn--${variant}`,
    size ? `osrs-modal-btn--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
