// AlertBanner is now part of Alert — import Alert and pass the `banner` prop.
// This re-export exists so existing imports don't break during the transition.
import Alert from './Alert';
import type { AlertProps } from './Alert';

type AlertBannerProps = Omit<AlertProps, 'banner'>;

export default function AlertBanner(props: AlertBannerProps) {
  return <Alert banner {...props} />;
}
