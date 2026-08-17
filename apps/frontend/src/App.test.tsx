import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ images: [] }) })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('renders app tool links', () => {
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/Tools & Simulators/i)).toBeInTheDocument();
  expect(screen.getByText(/Featured: Bingo Tools/i)).toBeInTheDocument();
});
