import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import BingoDraft from './BingoDraft';

beforeEach(() => {
  localStorage.clear();
});

test('persists added players and shows them when the draft starts', () => {
  const { container, unmount } = render(<BingoDraft />);
  const playersInput = container.querySelector('textarea');

  fireEvent.change(playersInput, { target: { value: 'Alice, Bob' } });

  expect(JSON.parse(localStorage.getItem('bingo-draft')).players).toBe('Alice, Bob');

  unmount();
  render(<BingoDraft />);

  fireEvent.click(screen.getByText('Start Draft'));

  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Bob')).toBeInTheDocument();
});
