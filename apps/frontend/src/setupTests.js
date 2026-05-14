import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('darkreader', () => ({
  enable: vi.fn(),
  disable: vi.fn(),
  auto: vi.fn(),
  isEnabled: vi.fn(() => false),
  setFetchMethod: vi.fn(),
}));
