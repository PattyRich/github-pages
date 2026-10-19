import { useEffect, useRef } from 'react';
import './GlassKcTracker.css';
import { API_BASE_URL } from '../../config';
import { trackAnalyticsEvent } from '../../analytics';

const usageEvents = new Set(['kc_boss_selected', 'kc_kill_recorded', 'kc_session_finished']);
const bossIds = new Set(['pnm', 'cox', 'toa', 'tob', 'cg', 'yama', 'nex']);

// Keep the standalone journal's SVG, dialogs and styles isolated from other tools.
// The shell supplies API config, theme tokens and the production analytics bridge.
export default function GlassKcTracker() {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onUsage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      if (!event.data || typeof event.data !== 'object') return;
      const message = event.data as Record<string, unknown>;
      const { type, name, boss, storage, kills } = message;
      if (
        type !== 'praynr:kc-analytics' ||
        typeof name !== 'string' ||
        !usageEvents.has(name) ||
        typeof boss !== 'string' ||
        !bossIds.has(boss) ||
        (storage !== 'guest' && storage !== 'account')
      )
        return;

      // Forward only these fixed fields, never journal content or account identifiers.
      const data: Record<string, string | number | boolean> = { boss, storage };
      if (name === 'kc_session_finished') {
        if (typeof kills !== 'number' || !Number.isInteger(kills) || kills < 1 || kills > 100000)
          return;
        data.kills = kills;
      }
      trackAnalyticsEvent(name, data);
    };
    window.addEventListener('message', onUsage);
    return () => window.removeEventListener('message', onUsage);
  }, []);

  return (
    <iframe
      ref={frame}
      className="glass-kc-tracker"
      title="KC Trackers"
      src={`${import.meta.env.BASE_URL}glass-kc/index.html?v=kc-trackers-4&api=${encodeURIComponent(API_BASE_URL)}`}
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
