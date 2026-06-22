import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Status from './Status';
import { fetchGet } from '../../utils/utils';

vi.mock('../../utils/utils', () => ({
  fetchGet: vi.fn(),
}));

const health = {
  status: 'degraded',
  mongo: {
    status: 'ok',
    latency_ms: 8,
    boards_count: 12,
    analytics: {
      board_types: { osrs: 10, generic: 2 },
      created: { last_24h: 1, last_7d: 4, last_30d: 9 },
      activity: { boards_with_progress: 12 },
      board_tiles: { total: 300, average_per_board: 25, largest_board: 36 },
      teams: { total: 18, average_per_board: 1.5 },
      progress: {
        team_tiles: 450,
        completed_tiles: 135,
        completion_percentage: 30,
        proof_notes: 120,
        proof_images: 45,
        points_earned: 2_250,
      },
      popular_layouts: [{ rows: 5, columns: 5, boards: 8 }],
    },
  },
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

test('shows board analytics in their own section', async () => {
  fetchGet.mockResolvedValue([health, null]);

  render(<Status />);

  expect(await screen.findByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
  expect(await screen.findByText('30%')).toBeInTheDocument();
  expect(screen.getByText('Boards created · 30 days')).toBeInTheDocument();
  expect(screen.getByText('2,250')).toBeInTheDocument();
  expect(screen.getByText('Boards with progress').parentElement).toHaveTextContent('12');
  expect(screen.getByText('10 OSRS · 2 generic')).toBeInTheDocument();
  expect(screen.getByText('5 × 5')).toBeInTheDocument();
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
