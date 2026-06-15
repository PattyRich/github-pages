import { useEffect, useRef, useState } from 'react';
import Alert from '../components/ui/Alert';
import type { AlertProps } from '../components/ui/Alert';
import type { AlertVariant } from '../types';

export type { AlertVariant };

const ALERT_TIMEOUT_MS = 5000;

type AlertBannerProps = Omit<AlertProps, 'banner' | 'children' | 'onDismiss' | 'variant'>;

/**
 * Shared alert-banner state with auto-dismiss.
 *
 * Call showAlert/alert to set the current banner. Render AlertBanner anywhere
 * in the route; it returns null when no alert is active.
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

  function AlertBanner({ dismissible = false, ...props }: AlertBannerProps) {
    if (!alertMessage) return null;

    return (
      <Alert
        banner
        dismissible={dismissible}
        onDismiss={dismissible ? clearAlert : undefined}
        variant={alertVariant}
        {...props}
      >
        {alertMessage}
      </Alert>
    );
  }

  return { AlertBanner, alert: showAlert, isLoading, showAlert, clearAlert };
}
