import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

test('renders app tool links', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/Tools & Simulators/i)).toBeInTheDocument();
  expect(screen.getByText(/Featured: Bingo Tools/i)).toBeInTheDocument();
});
