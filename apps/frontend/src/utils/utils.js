import { apiUrl } from '../config/api';

async function fetchRequest(url, method, body, requestOptions = {}) {
  try {
    const options = {
      method,
      headers: {
        Accept: 'application/json',
      },
    };
    if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const res = await fetch(apiUrl(url), options);
    const data = await readJson(res);
    if (!res.ok && requestOptions.allowErrorData && data) {
      return [data, normalizeApiError(data, res)];
    }
    if (!res.ok) return [null, normalizeApiError(data, res)];
    return [data, null];
  } catch (err) {
    console.error(err);
    return [null, err];
  }
}

export const fetchGet = (url, options) => fetchRequest(url, 'GET', undefined, options);
export const fetchPost = (url, body, options) => fetchRequest(url, 'POST', body, options);
export const fetchPut = (url, body, options) => fetchRequest(url, 'PUT', body, options);

export function getStoredBool(key, fallback = false) {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

export function setStoredBool(key, value) {
  localStorage.setItem(key, String(value));
}

export function encodePathSegment(segment) {
  return encodeURIComponent(String(segment ?? ''));
}

export function decodePathSegment(segment) {
  try {
    return decodeURIComponent(segment || '');
  } catch (err) {
    return segment || '';
  }
}

export function encodedPath(...segments) {
  return segments.map((segment) => encodePathSegment(segment)).join('/');
}

export function bingoBoardPath(boardName) {
  return `/bingo/${encodePathSegment(boardName)}`;
}

export function authUrlBuilder(boardName, password, pwtype) {
  return encodedPath('auth', boardName, password, pwtype);
}

export function pwUrlBuilder(state, teamPassword = null) {
  const isAdmin = (state.privilege ?? state.privilage) === 'admin';
  const pw = isAdmin ? state.adminPassword : state.generalPassword || state.adminPassword;
  const type = isAdmin ? 'admin' : 'general';
  const segments = [state.boardName, pw, type];
  if (state.teamPasswordsRequired && teamPassword) segments.push(teamPassword);
  return encodedPath(...segments);
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    if (!response.ok) return null;
    throw err;
  }
}

function normalizeApiError(data, response) {
  if (data?.message || data?.error) {
    return { ...data, status: response.status, message: data.message || data.error };
  }
  return new Error(response.statusText || `Request failed with status ${response.status}`);
}

export function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function recentBoardPrivilege(item) {
  return item?.privilege ?? item?.priv;
}

export function addToRecent(boardName, joinPw, privilege) {
  try {
    const stored = localStorage.getItem('recentBoards');
    let recentBoards = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(recentBoards)) {
      recentBoards = [];
    }
    const find = recentBoards.find((item) => {
      return item.boardName === boardName && privilege === recentBoardPrivilege(item);
    });
    if (!find) {
      const obj = {
        boardName: boardName,
        password: joinPw,
        privilege,
      };
      localStorage.setItem('recentBoards', JSON.stringify([...recentBoards, obj]));
    }
  } catch (e) {
    console.error('Error in addToRecent:', e);
  }
}
