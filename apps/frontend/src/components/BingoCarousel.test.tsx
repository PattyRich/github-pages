import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import BingoCarousel from './BingoCarousel';

function showcaseResponse(images: string[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ images }),
  };
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('randomizes API images once they load', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        showcaseResponse([
          'https://praynr.com/first.webp',
          'https://praynr.com/second.webp',
          'https://praynr.com/third.webp',
        ])
      )
  );

  const { container } = render(<BingoCarousel />);

  await waitFor(() => {
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://praynr.com/second.webp');
  });
});

test('keeps bundled previews when the API fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

  const { container } = render(<BingoCarousel />);

  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(container.querySelector('img')?.getAttribute('src')).toContain('board-min2.png');
});

test('returns to bundled previews when a showcase image fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(showcaseResponse(['https://praynr.com/missing.webp']))
  );

  const { container } = render(<BingoCarousel />);
  await waitFor(() => {
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://praynr.com/missing.webp'
    );
  });

  fireEvent.error(container.querySelector('img') as HTMLImageElement);

  expect(container.querySelector('img')?.getAttribute('src')).toContain('board-min2.png');
});

test('opens the active image in a larger preview', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(showcaseResponse(['https://praynr.com/featured.webp']))
  );

  const { container } = render(<BingoCarousel />);
  await waitFor(() => {
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://praynr.com/featured.webp'
    );
  });
  const previewButton = screen.getByRole('button', { name: 'Enlarge featured drop' });
  fireEvent.click(previewButton);

  expect(screen.getByRole('img', { name: 'Proof enlarged' })).toBeInTheDocument();
  expect(screen.getByText('1 / 1')).toBeInTheDocument();
});

test.each([
  ['arrow', 'Next Bingo image'],
  ['image marker', 'Show Bingo image 2 of 2'],
])('stops autoplay after a manual %s click', async (_control, accessibleName) => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        showcaseResponse(['https://praynr.com/first.webp', 'https://praynr.com/second.webp'])
      )
  );

  render(<BingoCarousel />);
  const control = await screen.findByRole('button', { name: accessibleName });
  const timeoutSpy = vi.spyOn(window, 'setTimeout');
  timeoutSpy.mockClear();

  fireEvent.click(control);

  expect(timeoutSpy.mock.calls.some(([, delay]) => delay === 7000)).toBe(false);
});
