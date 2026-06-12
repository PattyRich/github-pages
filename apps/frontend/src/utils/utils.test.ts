import { beforeEach, expect, test, vi } from 'vitest';
import {
  addToRecent,
  authUrlBuilder,
  bingoBoardPath,
  decodePathSegment,
  fetchGet,
  fetchPost,
  pwUrlBuilder,
} from './utils';
import type { RecentBoard } from './utils';

const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

function mockJsonResponse(data: unknown, response: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: vi.fn(() => Promise.resolve(JSON.stringify(data))),
    ...response,
  } as Response;
}

function storedRecentBoards(): RecentBoard[] {
  return JSON.parse(localStorage.getItem('recentBoards') || '[]') as RecentBoard[];
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
});

test('fetchGet prefixes relative API paths with the configured API base', async () => {
  fetchMock.mockResolvedValue(mockJsonResponse({ status: 'ok' }));

  const [data, err] = await fetchGet('health');

  expect(err).toBeNull();
  expect(data).toEqual({ status: 'ok' });
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:8000/health',
    expect.objectContaining({ method: 'GET' })
  );
});

test('fetchPost sends JSON payloads with content type', async () => {
  fetchMock.mockResolvedValue(mockJsonResponse({ success: true }));

  await fetchPost('feedback', { message: 'hello' });

  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:8000/feedback',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }),
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    })
  );
});

test('can return error response JSON when requested', async () => {
  fetchMock.mockResolvedValue(
    mockJsonResponse(
      { status: 'degraded', redis: { status: 'error' } },
      { ok: false, status: 503, statusText: 'Service Unavailable' }
    )
  );

  const [data, err] = await fetchGet('health', { allowErrorData: true });

  expect(data).toEqual({ status: 'degraded', redis: { status: 'error' } });
  expect(err).toBeInstanceOf(Error);
  expect(err?.message).toBe('Service Unavailable');
});

test('pwUrlBuilder encodes path segments safely', () => {
  const url = pwUrlBuilder(
    {
      boardName: 'TNI Clan Bingo',
      generalPassword: 'Sophie/general',
      privilege: 'general',
      teamPasswordsRequired: true,
    },
    'team pw'
  );

  expect(url).toBe('TNI%20Clan%20Bingo/Sophie%2Fgeneral/general/team%20pw');
});

test('board route and auth helpers encode spaces and hash characters', () => {
  expect(bingoBoardPath('Clan #1 Bingo')).toBe('/bingo/Clan%20%231%20Bingo');
  expect(authUrlBuilder('Clan Bingo', 'team pw', 'general')).toBe(
    'auth/Clan%20Bingo/team%20pw/general'
  );
});

test('decodePathSegment falls back for malformed manual URLs', () => {
  expect(decodePathSegment('Clan%20Bingo')).toBe('Clan Bingo');
  expect(decodePathSegment('Clan%')).toBe('Clan%');
});

test('pwUrlBuilder accepts legacy privilage key on board state', () => {
  expect(
    pwUrlBuilder({
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilage: 'admin',
    })
  ).toBe('my-board/adminpw/admin');
});

test('addToRecent stores privilege and deduplicates legacy priv entries', () => {
  localStorage.setItem(
    'recentBoards',
    JSON.stringify([{ boardName: 'board-1', password: 'pw', priv: 'general' }])
  );
  addToRecent('board-1', 'pw', 'general');
  expect(storedRecentBoards()).toHaveLength(1);

  addToRecent('board-2', 'pw2', 'admin');
  expect(storedRecentBoards()[1]).toEqual({
    boardName: 'board-2',
    password: 'pw2',
    privilege: 'admin',
  });
});
