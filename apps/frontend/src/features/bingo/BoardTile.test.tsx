import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import BoardTile from './BoardTile';

type BoardTileProps = ComponentProps<typeof BoardTile>;

const info = {
  title: 'Boss task',
  description: 'Defeat the boss',
  points: 100,
  image: null,
} satisfies BoardTileProps['info'];

const teamInfo = {
  checked: false,
  currPoints: 25,
  proof: '',
  proofImages: [],
} satisfies BoardTileProps['teamInfo'];

function renderBoardTile(overrides: Partial<BoardTileProps> = {}) {
  const props: BoardTileProps = {
    cord: [0, 0],
    change: vi.fn(),
    info,
    teamInfo,
    privilege: 'general',
    ...overrides,
  };

  return render(<BoardTile {...props} />);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

test('renders team progress on a tile', () => {
  renderBoardTile();

  expect(screen.getByText('Boss task')).toBeInTheDocument();
  expect(screen.getByText('25 / 100')).toBeInTheDocument();
});

test('opens the tile modal when the tile is clicked', () => {
  renderBoardTile();

  fireEvent.click(screen.getByText('Boss task'));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText(/Current Points/i)).toHaveValue('25');
});

test('opens the tile modal when Enter is pressed', () => {
  renderBoardTile();
  fireEvent.keyDown(screen.getByRole('button', { name: /Open Boss task/i }), { key: 'Enter' });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('uses the full-size Wiki image when pixel mode is requested', () => {
  const sourceUrl =
    'https://oldschool.runescape.wiki/images/thumb/Twisted_bow_detail.png/180px-Twisted_bow_detail.png';
  const cacheUrl = `https://example.test/static/uploads/board-images/wiki-cache?url=${encodeURIComponent(sourceUrl)}&sig=signed`;
  const { container } = renderBoardTile({
    info: {
      ...info,
      image: {
        opacity: 100,
        usePixel: true,
        url: cacheUrl,
      },
    },
  });

  expect(container.querySelector('.bg-img')).toHaveAttribute(
    'src',
    'https://oldschool.runescape.wiki/images/Twisted_bow.png'
  );
});

test('does not rewrite pixel image URLs on generic boards', () => {
  const sourceUrl =
    'https://oldschool.runescape.wiki/images/thumb/Twisted_bow_detail.png/180px-Twisted_bow_detail.png';
  const { container } = renderBoardTile({
    boardType: 'generic',
    info: {
      ...info,
      image: {
        opacity: 100,
        usePixel: true,
        url: sourceUrl,
      },
    },
  });

  expect(container.querySelector('.bg-img')).toHaveAttribute('src', sourceUrl);
});

test('shows green-bg class when tile is checked and completeStyle is off', () => {
  const { container } = renderBoardTile({
    teamInfo: { ...teamInfo, checked: true },
  });
  expect(container.querySelector('.tile-wrapper')).toHaveClass('green-bg');
});

test('does not show green-bg when completeStyle setting is on', () => {
  localStorage.setItem('completeStyle', 'true');
  const { container } = renderBoardTile({
    teamInfo: { ...teamInfo, checked: true },
  });
  expect(container.querySelector('.tile-wrapper')).not.toHaveClass('green-bg');
});

test('shows admin points badge for admin privilege', () => {
  renderBoardTile({ teamInfo: null, privilege: 'admin' });
  expect(screen.getByText('100')).toBeInTheDocument();
});

test('does not render interactive elements in bare mode', () => {
  renderBoardTile({ bare: true });
  expect(screen.queryByRole('button')).toBeNull();
});

test('hides title when showTitleTile setting is on', () => {
  localStorage.setItem('showTitleTile', 'true');
  renderBoardTile();
  expect(screen.queryByText('Boss task')).toBeNull();
});

test('hides progress badge when showPoints setting is on', () => {
  localStorage.setItem('showPoints', 'true');
  renderBoardTile();
  expect(screen.queryByText('25 / 100')).toBeNull();
});
