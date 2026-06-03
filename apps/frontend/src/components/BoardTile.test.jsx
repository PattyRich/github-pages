import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import BoardTile from './BoardTile';

const info = {
  title: 'Boss task',
  description: 'Defeat the boss',
  points: 100,
  image: null,
};

const teamInfo = {
  checked: false,
  currPoints: 25,
  proof: '',
  proofImages: [],
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

test('renders team progress on a tile', () => {
  render(
    <BoardTile
      cord={[0, 0]}
      change={vi.fn()}
      info={info}
      teamInfo={teamInfo}
      privilage="general"
    />
  );

  expect(screen.getByText('Boss task')).toBeInTheDocument();
  expect(screen.getByText('25 / 100')).toBeInTheDocument();
});

test('opens the tile modal when the tile is clicked', () => {
  render(
    <BoardTile
      cord={[0, 0]}
      change={vi.fn()}
      info={info}
      teamInfo={teamInfo}
      privilage="general"
    />
  );

  fireEvent.click(screen.getByText('Boss task'));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText(/Current Points/i)).toHaveValue('25');
});

test('uses the pixel image URL when requested', () => {
  const { container } = render(
    <BoardTile
      cord={[0, 0]}
      change={vi.fn()}
      info={{
        ...info,
        image: {
          opacity: 100,
          usePixel: true,
          url: 'https://oldschool.runescape.wiki/images/thumb/Twisted_bow_detail.png/180px-Twisted_bow_detail.png',
        },
      }}
      teamInfo={teamInfo}
      privilage="general"
    />
  );

  expect(container.querySelector('.bg-img')).toHaveAttribute(
    'src',
    'https://oldschool.runescape.wiki/images/Twisted_bow.png'
  );
});
