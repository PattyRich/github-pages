const LOCAL_API_BASE = 'http://localhost:8000';
const DEFAULT_API_BASE = 'https://praynr.com';

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlash(value) {
  return value.replace(/^\/+/, '');
}

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? LOCAL_API_BASE : DEFAULT_API_BASE)
);

export function apiUrl(path) {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}/${trimLeadingSlash(path)}`;
}
