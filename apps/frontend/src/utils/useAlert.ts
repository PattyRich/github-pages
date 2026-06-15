import { useEffect, useRef, useState } from 'react';
import type { AlertVariant } from '../types';

export type { AlertVariant };

const ALERT_TIMEOUT_MS = 5000;

/**
 * Shared alert-banner state with auto-dismiss.
 *
 * Returns:
 *   alertMessage  {string}  — current message to display (empty string = hidden)
 *   alertVariant  {string}  — 'danger' | 'success' | 'warning' | …
 *   isLoading     {boolean} — true while a 'loading' alert is active
 *   showAlert(variant, message, skipTimeout?)
 *       variant = 'loading'  → sets isLoading=true, variant='warning', message='Loading…'
 *       skipTimeout = true   → alert stays until explicitly cleared (useful for persistent errors)
 *   clearAlert()  — dismiss immediately and cancel any pending timeout
 */
export function useAlert() {
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState<AlertVariant>('');
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function clearAlert() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAlertMessage('');
    setIsLoading(false);
  }

  function showAlert(variant: AlertVariant, message = '', skipTimeout = false) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (variant === 'loading') {
      setAlertVariant('warning');
      setAlertMessage('Loading...');
      setIsLoading(true);
      return;
    }

    setAlertVariant(variant);
    setAlertMessage(message);
    setIsLoading(false);

    if (!skipTimeout) {
      timeoutRef.current = setTimeout(() => {
        setAlertMessage('');
        timeoutRef.current = null;
      }, ALERT_TIMEOUT_MS);
    }
  }

  return { alertMessage, alertVariant, isLoading, showAlert, clearAlert };
}
