import { beforeEach, expect, test, vi } from 'vitest';
import { fetchGet, fetchPost, pwUrlBuilder } from './utils';

function mockJsonResponse(data, response = {}) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: vi.fn(() => Promise.resolve(JSON.stringify(data))),
    ...response,
  };
}

beforeEach(() => {
  global.fetch = vi.fn();
  vi.clearAllMocks();
});

test('fetchGet prefixes relative API paths with the configured API base', async () => {
  global.fetch.mockResolvedValue(mockJsonResponse({ status: 'ok' }));

  const [data, err] = await fetchGet('health');

  expect(err).toBeNull();
  expect(data).toEqual({ status: 'ok' });
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8000/health',
    expect.objectContaining({ method: 'GET' })
  );
});

test('fetchPost sends JSON payloads with content type', async () => {
  global.fetch.mockResolvedValue(mockJsonResponse({ success: true }));

  await fetchPost('feedback', { message: 'hello' });

  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8000/feedback',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }),
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    })
  );
});

test('can return error response JSON when requested', async () => {
  global.fetch.mockResolvedValue(
    mockJsonResponse(
      { status: 'degraded', redis: { status: 'error' } },
      { ok: false, status: 503, statusText: 'Service Unavailable' }
    )
  );

  const [data, err] = await fetchGet('health', { allowErrorData: true });

  expect(data).toEqual({ status: 'degraded', redis: { status: 'error' } });
  expect(err).toBeInstanceOf(Error);
  expect(err.message).toBe('Service Unavailable');
});

test('pwUrlBuilder encodes path segments safely', () => {
  const url = pwUrlBuilder(
    {
      boardName: 'TNI Clan Bingo',
      generalPassword: 'Sophie/general',
      privilage: 'general',
      teamPasswordsRequired: true,
    },
    'team pw'
  );

  expect(url).toBe('TNI%20Clan%20Bingo/Sophie%2Fgeneral/general/team%20pw');
});
