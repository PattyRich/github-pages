export const BINGO_PATH = '/bingo/play';
export const KC_TRACKER_PATH = '/kc-trackers/track';
export const ROUTE_RECOVERY_PARAM = '__praynr_route';
export const ROUTE_RECOVERY_STATE = 'praynr-route-recovery-state';
const GITHUB_HOSTNAME = 'pattyrich.github.io';

export function boardPath(boardName: unknown): string {
  const name = String(boardName ?? '');
  // Browsers remove dot-only URL segments, including percent-encoded dots.
  if (name === '.' || name === '..') {
    return `/bingo/board?boardName=${encodeURIComponent(name)}`;
  }
  return `/bingo/board/${encodeURIComponent(name)}`;
}

export function canonicalAppPath(pathname: string, legacyHash = false): string {
  const path = pathname.replace(/^\/github-pages(?=\/|$)/, '') || '/';
  if (!path.startsWith('/') || path.startsWith('//')) return '/';
  if (/^\/glass-kc\/?$/.test(path)) return KC_TRACKER_PATH;
  if (/^\/bingo\/?$/.test(path)) return BINGO_PATH;
  if (/^\/bingo\/(create|join)\/?$/.test(path)) return path.replace(/\/$/, '');

  const oldBoard = path.match(/^\/bingo\/([^/]+)\/?$/);
  if (oldBoard && (legacyHash || !['play', 'board'].includes(oldBoard[1]))) {
    let name = oldBoard[1];
    try {
      name = decodeURIComponent(name);
    } catch {
      // Keep malformed manually entered names readable instead of crashing.
    }
    return boardPath(name);
  }
  return path;
}

export function appRouteForUrl(url: URL): string {
  const legacyHash = url.hash.startsWith('#/');
  const route = legacyHash ? url.hash.slice(1) : url.pathname + url.search + url.hash;
  const fragmentIndex = route.indexOf('#');
  const fragment = fragmentIndex < 0 ? '' : route.slice(fragmentIndex);
  const beforeFragment = fragmentIndex < 0 ? route : route.slice(0, fragmentIndex);
  const queryIndex = beforeFragment.indexOf('?');
  const pathname = queryIndex < 0 ? beforeFragment : beforeFragment.slice(0, queryIndex);
  const query = queryIndex < 0 ? '' : beforeFragment.slice(queryIndex + 1);
  // Hash-route parameters take precedence; retain outside campaign parameters too.
  const search = [query, legacyHash ? url.search.slice(1) : ''].filter(Boolean).join('&');
  const canonical = canonicalAppPath(pathname, legacyHash);
  const separator = canonical.includes('?') ? '&' : '?';
  return canonical + (search ? separator + search : '') + fragment;
}

export function browserRouteTarget(url: URL, base = import.meta.env.BASE_URL): string {
  const route = appRouteForUrl(url);
  // Recent Boards must retain GitHub Pages' origin and its existing local storage.
  if (url.hostname === GITHUB_HOSTNAME && route.split(/[?#]/)[0] !== '/recents') {
    return `https://praynr.com${route}`;
  }
  return base.replace(/\/$/, '') + route;
}

export function initializeBrowserRoutes(): boolean {
  const url = new URL(window.location.href);
  const recovered = url.searchParams.get(ROUTE_RECOVERY_PARAM);
  if (recovered?.startsWith('/') && !recovered.startsWith('//')) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    let state = window.history.state;
    try {
      const saved = window.sessionStorage.getItem(ROUTE_RECOVERY_STATE);
      window.sessionStorage.removeItem(ROUTE_RECOVERY_STATE);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed?.route === recovered) state = parsed.state;
    } catch {
      // Route recovery still works when browser storage is unavailable.
    }
    window.history.replaceState(state, '', base + recovered);
  }

  const current = new URL(window.location.href);
  const target = browserRouteTarget(current);
  if (target.startsWith('https://')) {
    window.location.replace(target);
    return false;
  }
  if (target !== current.pathname + current.search + current.hash) {
    window.history.replaceState(window.history.state, '', target);
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#/')) {
      window.location.replace(browserRouteTarget(new URL(window.location.href)));
    }
  });
  return true;
}
