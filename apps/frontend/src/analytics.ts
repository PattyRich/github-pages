const UMAMI_SCRIPT_URL = 'https://cloud.umami.is/script.js';
const UMAMI_HOSTNAME = 'praynr.com';

type UmamiPayload = {
  url?: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    normalizeUmamiPayload?: (type: string, payload: UmamiPayload) => UmamiPayload;
  }
}

export function normalizeAnalyticsUrl(value: string): string {
  const url = new URL(value, `https://${UMAMI_HOSTNAME}`);
  const hashRoute = url.hash.startsWith('#/') ? url.hash.slice(1) : '';
  const routeWithQuery = hashRoute || url.pathname;
  const route = routeWithQuery.split('?')[0].replace(/^\/github-pages(?=\/|$)/, '') || '/';

  if (/^\/bingo\/(?!create$|join$)[^/]+$/.test(route)) {
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

export function initializeAnalytics(): void {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;

  if (!websiteId || window.location.hostname !== UMAMI_HOSTNAME) return;

  window.normalizeUmamiPayload = normalizeUmamiPayload;

  const script = document.createElement('script');
  script.defer = true;
  script.src = UMAMI_SCRIPT_URL;
  script.dataset.websiteId = websiteId;
  script.dataset.domains = UMAMI_HOSTNAME;
  script.dataset.beforeSend = 'normalizeUmamiPayload';
  document.head.appendChild(script);
}
