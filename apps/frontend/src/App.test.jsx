import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { disable, enable, setFetchMethod } from 'darkreader';
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

test('enables Dark Reader with the fetch hook when dark mode is stored', () => {
  localStorage.setItem('darkMode', 'true');

  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  expect(setFetchMethod).toHaveBeenCalledWith(expect.any(Function));
  expect(enable).toHaveBeenCalledWith({
    brightness: 100,
    contrast: 90,
    sepia: 10,
  });
  expect(disable).not.toHaveBeenCalled();
});

test('disables Dark Reader when dark mode is off', () => {
  localStorage.setItem('darkMode', 'false');

  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  expect(disable).toHaveBeenCalled();
  expect(enable).not.toHaveBeenCalled();
});
