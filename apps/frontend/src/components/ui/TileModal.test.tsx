import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import TileModal from './TileModal';

type TileModalProps = ComponentProps<typeof TileModal>;

const baseInfo = {
  title: 'Dragon task',
  description: 'Kill the dragon',
  points: 50,
} satisfies TileModalProps['info'];

const baseTeamInfo = {
  checked: false,
  currPoints: 10,
  proof: '',
} satisfies TileModalProps['teamInfo'];

function renderTileModal(overrides: Partial<TileModalProps> = {}) {
  const change = vi.fn();
  const handleClose = vi.fn();
  const props = {
    cord: [1, 2],
    change,
    handleClose,
    info: baseInfo,
    teamInfo: baseTeamInfo,
    privilege: 'member',
    show: true,
    ...overrides,
  } satisfies TileModalProps;

  render(<TileModal {...props} />);

  return { ...props, change, handleClose };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('toggles completed and saves member progress', async () => {
  const props = renderTileModal();
  const completed = screen.getByLabelText(/Completed\?/i);

  expect(completed).toBeVisible();
  expect(completed).toHaveClass('tm-check-input');
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

test('general users can edit current points but not total points', () => {
  renderTileModal();

  expect(screen.getByLabelText(/Current Points/i)).toBeEnabled();
  expect(screen.getByLabelText(/Total Points/i)).toBeDisabled();
});

test('admins can edit total points but not current points', () => {
  renderTileModal({ privilege: 'admin', teamInfo: {} });

  expect(screen.getByLabelText(/Current Points/i)).toBeDisabled();
  expect(screen.getByLabelText(/Total Points/i)).toBeEnabled();
});

test('shows bundled tile images but saves the selected object as a wiki detail image', async () => {
  const props = renderTileModal({ privilege: 'admin', teamInfo: {} });

  fireEvent.click(screen.getByRole('button', { name: /Set Tile Background Image/i }));
  expect(screen.getByRole('heading', { name: /Set Tile Background Image/i })).toBeInTheDocument();

  const tileImages = screen.getAllByRole('img').filter((img) => img.getAttribute('title'));
  expect(tileImages.length).toBeGreaterThan(0);

  const selectedTitle = tileImages[0]?.getAttribute('title') || '';
  const wikiName = encodeURIComponent(selectedTitle.replaceAll(' ', '_'));
  const expectedWikiUrl = `https://oldschool.runescape.wiki/images/thumb/${wikiName}_detail.png/180px-${wikiName}_detail.png`;

  fireEvent.click(tileImages[0]);

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /Remove Tile Background Image/i })
    ).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /Remove Tile Background Image/i })
    ).toBeInTheDocument();
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

test('closes modal when escape key is pressed', () => {
  const props = renderTileModal();

  fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

  expect(props.handleClose).toHaveBeenCalled();
});

test('clears loading and shows an error when wiki search fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network error')))
  );

  renderTileModal({ privilege: 'admin', teamInfo: {} });

  fireEvent.click(screen.getByRole('button', { name: /Set Tile Background Image/i }));

  const searchInput = screen.getByLabelText(/Item Search/i);
  fireEvent.change(searchInput, { target: { value: 'Coins' } });

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not reach the OSRS wiki/i);
  });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  vi.unstubAllGlobals();
});

test('does not close modal on escape if lightbox is open', () => {
  const props = renderTileModal({
    teamInfo: {
      checked: false,
      currPoints: 10,
      proof: '',
      proofImages: ['data:image/png;base64,iVBORw0KGgo='],
    },
  });

  const img = screen.getByRole('img', { name: /proof/i });
  fireEvent.click(img);

  expect(screen.getByText('1 / 1')).toBeInTheDocument();

  fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

  expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  expect(props.handleClose).not.toHaveBeenCalled();
});
