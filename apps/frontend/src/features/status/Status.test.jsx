import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Status from './Status';
import { fetchGet } from '../../utils/utils';

vi.mock('../../utils/utils', () => ({
  fetchGet: vi.fn(),
}));

const health = {
  status: 'degraded',
  mongo: { status: 'ok', latency_ms: 8, boards_count: 12 },
  redis: { status: 'error', error: 'connection refused' },
  rq: { status: 'ok', workers: 0, queued: 2, started: 0, failed: 1 },
  uptime_seconds: 3660,
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test('loads health through the shared fetch helper', async () => {
  fetchGet.mockResolvedValue([health, null]);

  render(<Status />);

  await waitFor(() => {
    expect(fetchGet).toHaveBeenCalledWith('health', { allowErrorData: true });
  });
  expect((await screen.findAllByText(/degraded/i)).length).toBeGreaterThan(0);
  expect(screen.getByText(/MongoDB/i)).toBeInTheDocument();
  expect(screen.getAllByText(/connection refused/i).length).toBeGreaterThan(0);
});

test('still displays degraded health data returned with an HTTP error', async () => {
  fetchGet.mockResolvedValue([health, new Error('Service Unavailable')]);

  render(<Status />);

  expect((await screen.findAllByText(/degraded/i)).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Could not reach the API/i)).not.toBeInTheDocument();
  expect(screen.getByText(/"status": "degraded"/i)).toBeInTheDocument();
});

test('shows unreachable state when health has no JSON payload', async () => {
  fetchGet.mockResolvedValue([null, new Error('Network error')]);

  render(<Status />);

  expect(await screen.findByText(/API unreachable/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Could not reach the API/i).length).toBeGreaterThan(0);
});
