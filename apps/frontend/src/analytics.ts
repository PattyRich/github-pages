const UMAMI_SCRIPT_URL = 'https://cloud.umami.is/script.js';
const UMAMI_HOSTNAME = 'praynr.com';
const UMAMI_WEBSITE_ID = '7653485f-733c-4d4f-8cc2-ad783f8216b4';

type UmamiPayload = {
  url?: string;
  [key: string]: unknown;
};

type AnalyticsEvent = {
  name: string;
  data: Record<string, string | number | boolean>;
  url: string;
};

const pendingEvents: AnalyticsEvent[] = [];
let analyticsUnavailable = false;

declare global {
  interface Window {
    normalizeUmamiPayload?: (type: string, payload: UmamiPayload) => UmamiPayload;
    umami?: {
      track: (payload: (props: UmamiPayload) => UmamiPayload) => unknown;
    };
  }
}

export function normalizeAnalyticsUrl(value: string): string {
  const url = new URL(value, `https://${UMAMI_HOSTNAME}`);
  const hashRoute = url.hash.startsWith('#/') ? url.hash.slice(1) : '';
  const routeWithQuery = hashRoute || url.pathname;
  const route = routeWithQuery.split('?')[0].replace(/^\/github-pages(?=\/|$)/, '') || '/';

  if (
    /^\/bingo\/board(?:\/[^/]+)?\/?$/.test(route) ||
    /^\/bingo\/(?!create$|join$|play$)[^/]+\/?$/.test(route)
  ) {
    return '/bingo/:boardName';
  }

  return route;
}

export function normalizeUmamiPayload(_type: string, payload: UmamiPayload): UmamiPayload {
  if (!payload.url) return payload;

  return {
    ...payload,
    url: normalizeAnalyticsUrl(payload.url),
  };
}

function sendAnalyticsEvent(event: AnalyticsEvent): void {
  try {
    void Promise.resolve(window.umami?.track((props) => ({ ...props, ...event }))).catch(() => {});
  } catch {
    // Analytics must never interrupt a journal action.
  }
}

export function trackAnalyticsEvent(
  name: string,
  data: Record<string, string | number | boolean>
): void {
  if (window.location.hostname !== UMAMI_HOSTNAME || analyticsUnavailable) return;

  const event = { name, data: { ...data }, url: normalizeAnalyticsUrl(window.location.href) };
  if (window.umami?.track) {
    sendAnalyticsEvent(event);
  } else {
    if (pendingEvents.length === 50) pendingEvents.shift();
    pendingEvents.push(event);
  }
}

export function initializeAnalytics(): void {
  if (window.location.hostname !== UMAMI_HOSTNAME) return;

  window.normalizeUmamiPayload = normalizeUmamiPayload;

  const script = document.createElement('script');
  script.defer = true;
  script.src = UMAMI_SCRIPT_URL;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.dataset.domains = UMAMI_HOSTNAME;
  script.dataset.beforeSend = 'normalizeUmamiPayload';
  script.addEventListener('load', () => {
    analyticsUnavailable = !window.umami?.track;
    const events = pendingEvents.splice(0);
    if (!analyticsUnavailable) events.forEach(sendAnalyticsEvent);
  });
  script.addEventListener('error', () => {
    analyticsUnavailable = true;
    pendingEvents.length = 0;
  });
  document.head.appendChild(script);
}
