import { useEffect, useRef } from 'react';
import './Toast.css';

/**
 * OSRS-styled toast notification — drop-in replacement for the Bootstrap version.
 *
 * Props (unchanged from old component):
 *   title     {string}
 *   message   {string}
 *   variant   {string}  'info' | 'success' | 'danger' | 'warning'
 *   position  {string}  Bootstrap position string e.g. 'top-end', 'middle-center'
 *   timeout   {number}  ms before auto-close (default 6000)
 *   onClose   {fn}
 */
export default function Toast({
  title,
  message,
  variant = 'info',
  position = 'top-end',
  timeout = 6000,
  onClose,
}) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onClose?.();
    }, timeout);
    return () => clearTimeout(timerRef.current);
  }, [timeout, onClose]);

  return (
    <div className={`osrs-toast-container osrs-toast-pos--${normalizePosition(position)}`}>
      <div className={`osrs-toast osrs-toast-${variant}`} role="alert" aria-live="polite">
        <div className="osrs-toast-header">
          <span className="osrs-toast-title">{title}</span>
          <button className="osrs-toast-close" onClick={onClose} aria-label="Close notification">
            ✕
          </button>
        </div>
        <div className="osrs-toast-body">{message}</div>
      </div>
    </div>
  );
}

function normalizePosition(pos) {
  const map = {
    'top-start': 'top-start',
    'top-center': 'top-center',
    'top-end': 'top-end',
    'middle-start': 'middle-start',
    'middle-center': 'middle-center',
    'middle-end': 'middle-end',
    'bottom-start': 'bottom-start',
    'bottom-center': 'bottom-center',
    'bottom-end': 'bottom-end',
  };
  return map[pos] ?? 'top-end';
}
