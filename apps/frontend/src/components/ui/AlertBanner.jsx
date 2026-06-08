// AlertBanner is now part of Alert — import Alert and pass the `banner` prop.
// This re-export exists so existing imports don't break during the transition.
import Alert from './Alert';

export default function AlertBanner(props) {
  return <Alert banner {...props} />;
}
