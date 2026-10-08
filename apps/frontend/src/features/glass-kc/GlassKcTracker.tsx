import './GlassKcTracker.css';
import { API_BASE_URL } from '../../config';

// Keep the standalone journal's SVG, dialogs and styles isolated from other tools.
// The drawing engine stays standalone; the shell supplies API config and theme tokens.
export default function GlassKcTracker() {
  return (
    <iframe
      className="glass-kc-tracker"
      title="Glass KC Tracker"
      src={`${import.meta.env.BASE_URL}glass-kc/index.html?v=raid-modes-2&api=${encodeURIComponent(API_BASE_URL)}`}
      onLoad={(event) => {
        const root = event.currentTarget.contentDocument?.documentElement;
        if (!root) return;
        const theme = getComputedStyle(document.documentElement);
        for (const property of Array.from(theme)) {
          if (property.startsWith('--osrs-')) {
            root.style.setProperty(property, theme.getPropertyValue(property));
          }
        }
      }}
    />
  );
}
