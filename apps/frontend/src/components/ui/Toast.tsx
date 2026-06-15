import { useEffect, useRef } from 'react';
import './Toast.css';

type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'middle-start'
  | 'middle-center'
  | 'middle-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

interface ToastProps {
  message?: string;
  onClose?: () => void;
  position?: string;
  timeout?: number;
  title?: string;
  variant?: string;
}

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
}: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onClose?.();
    }, timeout);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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

function normalizePosition(pos: string): ToastPosition {
  const map: Record<ToastPosition, ToastPosition> = {
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
  return pos in map ? map[pos as ToastPosition] : 'top-end';
}
