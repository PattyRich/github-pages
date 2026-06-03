import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import LolBeat from './LolBeat';
import { fetchGet, fetchPost } from '../utils/utils.js';

vi.mock('../utils/utils.js', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(['16.9.1']),
    })
  );
});

afterEach(() => {
  cleanup();
});

test('searches the chain through the shared fetch helper', async () => {
  fetchGet.mockResolvedValue([[], null]);
  fetchGet.mockResolvedValueOnce([{ found: false, chain: [] }, null]);

  render(<LolBeat />);

  fireEvent.change(screen.getByPlaceholderText(/GameName#TagLine/i), {
    target: { value: 'Cool Player#NA1' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Find Path/i }));

  await waitFor(() => {
    expect(fetchGet).toHaveBeenCalledWith('lol/api/chain?riot_id=Cool%20Player%23NA1');
  });
  expect(await screen.findByText(/No path found yet from Cool Player#NA1/i)).toBeInTheDocument();
});

test('starts a crawl through the shared fetch helper', async () => {
  fetchPost.mockResolvedValue([{ job_id: 'job-123' }, null]);

  render(<LolBeat />);

  fireEvent.change(screen.getByPlaceholderText(/GameName#TagLine/i), {
    target: { value: 'Crawler#NA1' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Crawl My Games/i }));

  await waitFor(() => {
    expect(fetchPost).toHaveBeenCalledWith('lol/api/crawl', { riot_id: 'Crawler#NA1' });
  });
  expect(await screen.findByText(/Crawling in progress/i)).toBeInTheDocument();
});

test('shows crawl errors returned by the shared helper', async () => {
  fetchPost.mockResolvedValue([null, new Error('crawl failed')]);

  render(<LolBeat />);

  fireEvent.change(screen.getByPlaceholderText(/GameName#TagLine/i), {
    target: { value: 'Crawler#NA1' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Crawl My Games/i }));

  expect(await screen.findByText(/crawl failed/i)).toBeInTheDocument();
});
