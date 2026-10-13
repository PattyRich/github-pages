import {
  appRouteForUrl,
  browserRouteTarget,
  ROUTE_RECOVERY_PARAM,
  ROUTE_RECOVERY_STATE,
} from './routing';

const url = new URL(window.location.href);
const target = browserRouteTarget(url);
if (target.startsWith('https://')) {
  window.location.replace(target);
} else {
  // Static hosts cannot serve SPA deep links. Recover the route through the root
  // document, then replace history before BrowserRouter reads the URL.
  const route = appRouteForUrl(url);
  try {
    window.sessionStorage.setItem(
      ROUTE_RECOVERY_STATE,
      JSON.stringify({ route, state: window.history.state })
    );
  } catch {
    // Preserve the destination even when browser storage is unavailable.
  }
  const params = new URLSearchParams({ [ROUTE_RECOVERY_PARAM]: route });
  window.location.replace(`${import.meta.env.BASE_URL}?${params}`);
}
