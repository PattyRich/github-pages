import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import TileModal from './TileModal';

const baseInfo = {
  title: 'Dragon task',
  description: 'Kill the dragon',
  points: 50,
};

const baseTeamInfo = {
  checked: false,
  currPoints: 10,
  proof: '',
};

function renderTileModal(overrides = {}) {
  const props = {
    cord: [1, 2],
    change: vi.fn(),
    handleClose: vi.fn(),
    info: baseInfo,
    teamInfo: baseTeamInfo,
    privilage: 'member',
    show: true,
    ...overrides,
  };

  render(<TileModal {...props} />);

  return props;
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('toggles completed and saves member progress', async () => {
  const props = renderTileModal();
  const completed = screen.getByLabelText(/Completed\?/i);

  expect(completed).toBeVisible();
  expect(completed).toHaveClass('bingo-completed-check');
  expect(completed).not.toBeChecked();

  fireEvent.click(completed);
  expect(completed).toBeChecked();

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(props.change).toHaveBeenCalled());
  expect(props.change).toHaveBeenCalledWith(
    1,
    2,
    expect.objectContaining({
      checked: true,
      currPoints: 50,
      proof: '',
    })
  );
  expect(props.handleClose).toHaveBeenCalled();
});

test('shows bundled tile images but saves the selected object as a wiki detail image', async () => {
  const props = renderTileModal({ privilage: 'admin', teamInfo: {} });

  fireEvent.click(screen.getByRole('button', { name: /Set Tile Background Image/i }));
  expect(screen.getByRole('heading', { name: /Set Tile Background Image/i })).toBeInTheDocument();

  const tileImages = screen.getAllByRole('img').filter((img) => img.getAttribute('title'));
  expect(tileImages.length).toBeGreaterThan(0);

  const selectedTitle = tileImages[0].getAttribute('title');
  const wikiName = encodeURIComponent(selectedTitle.replaceAll(' ', '_'));
  const expectedWikiUrl = `https://oldschool.runescape.wiki/images/thumb/${wikiName}_detail.png/180px-${wikiName}_detail.png`;

  fireEvent.click(tileImages[0]);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Remove Tile Background Image/i })).toBeInTheDocument();
  });
  expect(screen.getByRole('img')).toHaveAttribute('src', expectedWikiUrl);

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(props.change).toHaveBeenCalled());

  const savedState = props.change.mock.calls[0][2];
  expect(savedState.image).toEqual(
    expect.objectContaining({
      opacity: '100',
      usePixel: false,
      url: expectedWikiUrl,
    })
  );
});
