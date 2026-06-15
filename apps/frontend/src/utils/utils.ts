import { apiUrl } from '../config/api';

type HttpMethod = 'GET' | 'POST' | 'PUT';

export interface FetchRequestOptions {
  allowErrorData?: boolean;
}

export interface ApiErrorPayload {
  [key: string]: unknown;
  error?: string;
  message: string;
  status?: number;
}

type ApiErrorData = Record<string, unknown> & {
  error?: string;
  message?: string;
};

export type ApiError = ApiErrorPayload | Error;
export type FetchResult<T> = Promise<[T | null, ApiError | null]>;

export interface PasswordState {
  adminPassword?: string;
  boardName?: string;
  generalPassword?: string;
  privilege?: string;
  privilage?: string;
  teamPasswordsRequired?: boolean;
}

export interface RecentBoard {
  boardName?: string;
  password?: string;
  priv?: string;
  privilege?: string;
}

async function fetchRequest<T = unknown>(
  url: string,
  method: HttpMethod,
  body?: unknown,
  requestOptions: FetchRequestOptions = {}
): FetchResult<T> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const options: RequestInit = {
      method,
      headers,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const res = await fetch(apiUrl(url), options);
    const data = await readJson(res);
    if (!res.ok && requestOptions.allowErrorData && data) {
      return [data as T, normalizeApiError(data, res)];
    }
    if (!res.ok) return [null, normalizeApiError(data, res)];
    return [data as T, null];
  } catch (err) {
    console.error(err);
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}

export const fetchGet = <T = unknown>(url: string, options?: FetchRequestOptions) =>
  fetchRequest<T>(url, 'GET', undefined, options);
export const fetchPost = <T = unknown>(
  url: string,
  body?: unknown,
  options?: FetchRequestOptions
) => fetchRequest<T>(url, 'POST', body, options);
export const fetchPut = <T = unknown>(url: string, body?: unknown, options?: FetchRequestOptions) =>
  fetchRequest<T>(url, 'PUT', body, options);

export function getStoredBool(key: string, fallback = false): boolean {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

export function setStoredBool(key: string, value: boolean): void {
  localStorage.setItem(key, String(value));
}

export function encodePathSegment(segment: unknown): string {
  return encodeURIComponent(String(segment ?? ''));
}

export function decodePathSegment(segment?: string | null): string {
  try {
    return decodeURIComponent(segment || '');
  } catch {
    return segment || '';
  }
}

export function encodedPath(...segments: unknown[]): string {
  return segments.map((segment) => encodePathSegment(segment)).join('/');
}

export function bingoBoardPath(boardName: unknown): string {
  return `/bingo/${encodePathSegment(boardName)}`;
}

export function authUrlBuilder(boardName: unknown, password: unknown, pwtype: unknown): string {
  return encodedPath('auth', boardName, password, pwtype);
}

export function pwUrlBuilder(state: PasswordState, teamPassword: string | null = null): string {
  const isAdmin = (state.privilege ?? state.privilage) === 'admin';
  const pw = isAdmin ? state.adminPassword : state.generalPassword || state.adminPassword;
  const type = isAdmin ? 'admin' : 'general';
  const segments = [state.boardName, pw, type];
  if (state.teamPasswordsRequired && teamPassword) segments.push(teamPassword);
  return encodedPath(...segments);
}

async function readJson(response: Response): Promise<unknown | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    if (!response.ok) return null;
    throw err;
  }
}

function normalizeApiError(data: unknown, response: Response): ApiError {
  if (isApiErrorData(data)) {
    return {
      ...data,
      status: response.status,
      message: String(data.message || data.error),
    };
  }
  return new Error(response.statusText || `Request failed with status ${response.status}`);
}

export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout>;
  return function (...args: Args) {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function recentBoardPrivilege(item?: RecentBoard | null): string | undefined {
  return item?.privilege ?? item?.priv;
}

export function addToRecent(boardName: string, joinPw: string, privilege: string): void {
  const recentBoards = getRecentBoards();
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
}

function getRecentBoards(): RecentBoard[] {
  const stored = localStorage.getItem('recentBoards');
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isRecentBoard) : [];
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiErrorData(value: unknown): value is ApiErrorData {
  return isRecord(value) && (typeof value.message === 'string' || typeof value.error === 'string');
}

function isRecentBoard(value: unknown): value is RecentBoard {
  return isRecord(value);
}
