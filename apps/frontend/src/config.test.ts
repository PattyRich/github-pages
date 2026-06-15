import { expect, test } from 'vitest';
import { API_BASE_URL, apiUrl } from './config';

test('uses localhost API base in Vite dev and test mode', () => {
  expect(API_BASE_URL).toBe('http://localhost:8000');
});

test('builds API URLs without duplicate slashes', () => {
  expect(apiUrl('health')).toBe('http://localhost:8000/health');
  expect(apiUrl('/health')).toBe('http://localhost:8000/health');
});

test('leaves absolute URLs untouched', () => {
  expect(apiUrl('https://example.com/api')).toBe('https://example.com/api');
});
