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
    <BoardTile cord={[0, 0]} change={vi.fn()} info={info} teamInfo={teamInfo} privilege="general" />
  );

  expect(screen.getByText('Boss task')).toBeInTheDocument();
  expect(screen.getByText('25 / 100')).toBeInTheDocument();
});

test('opens the tile modal when the tile is clicked', () => {
  render(
    <BoardTile cord={[0, 0]} change={vi.fn()} info={info} teamInfo={teamInfo} privilege="general" />
  );

  fireEvent.click(screen.getByText('Boss task'));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText(/Current Points/i)).toHaveValue('25');
});

test('opens the tile modal when Enter is pressed', () => {
  render(
    <BoardTile cord={[0, 0]} change={vi.fn()} info={info} teamInfo={teamInfo} privilege="general" />
  );
  fireEvent.keyDown(screen.getByRole('button', { name: /Open Boss task/i }), { key: 'Enter' });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
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
      privilege="general"
    />
  );

  expect(container.querySelector('.bg-img')).toHaveAttribute(
    'src',
    'https://oldschool.runescape.wiki/images/Twisted_bow.png'
  );
});

test('shows green-bg class when tile is checked and completeStyle is off', () => {
  const { container } = render(
    <BoardTile
      cord={[0, 0]}
      change={vi.fn()}
      info={info}
      teamInfo={{ ...teamInfo, checked: true }}
      privilege="general"
    />
  );
  expect(container.querySelector('.tile-wrapper')).toHaveClass('green-bg');
});

test('does not show green-bg when completeStyle setting is on', () => {
  localStorage.setItem('completeStyle', 'true');
  const { container } = render(
    <BoardTile
      cord={[0, 0]}
      change={vi.fn()}
      info={info}
      teamInfo={{ ...teamInfo, checked: true }}
      privilege="general"
    />
  );
  expect(container.querySelector('.tile-wrapper')).not.toHaveClass('green-bg');
});

test('shows admin points badge for admin privilege', () => {
  render(
    <BoardTile cord={[0, 0]} change={vi.fn()} info={info} teamInfo={null} privilege="admin" />
  );
  expect(screen.getByText('100')).toBeInTheDocument();
});

test('does not render interactive elements in bare mode', () => {
  render(<BoardTile cord={[0, 0]} change={vi.fn()} info={info} bare />);
  expect(screen.queryByRole('button')).toBeNull();
});

test('hides title when showTitleTile setting is on', () => {
  localStorage.setItem('showTitleTile', 'true');
  render(
    <BoardTile cord={[0, 0]} change={vi.fn()} info={info} teamInfo={teamInfo} privilege="general" />
  );
  expect(screen.queryByText('Boss task')).toBeNull();
});

test('hides progress badge when showPoints setting is on', () => {
  localStorage.setItem('showPoints', 'true');
  render(
    <BoardTile cord={[0, 0]} change={vi.fn()} info={info} teamInfo={teamInfo} privilege="general" />
  );
  expect(screen.queryByText('25 / 100')).toBeNull();
});
