import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import BoardAuditModal from './BoardAuditModal';

test('renders safe activity summaries and loads older events', () => {
  const onClose = vi.fn();
  const onLoadMore = vi.fn();

  render(
    <BoardAuditModal
      events={[
        {
          id: 'event-1',
          createdAt: '2026-06-22T12:00:00.000Z',
          eventType: 'tile.updated',
          actor: { role: 'team', teamId: 0, teamName: 'Green Dragons' },
          target: { type: 'tile', row: 2, col: 1, title: 'Barrows run' },
          changes: [
            { field: 'checked', before: false, after: true },
            { field: 'proof', changed: true },
            { field: 'proofImages', added: 2, removed: 1 },
          ],
        },
      ]}
      error={null}
      hasMore={true}
      loading={false}
      onClose={onClose}
      onLoadMore={onLoadMore}
    />
  );

  expect(screen.getByText('Board History')).toBeVisible();
  expect(screen.getByText(/Tile 2, 3: Barrows run/i)).toBeVisible();
  expect(screen.getByText('Green Dragons')).toBeVisible();
  expect(screen.getByText('Completion: Off → On')).toBeVisible();
  expect(screen.getByText('Proof note updated')).toBeVisible();
  expect(screen.getByText('Proof images: 2 added, 1 removed')).toBeVisible();

  fireEvent.click(screen.getByRole('button', { name: /Load older activity/i }));
  expect(onLoadMore).toHaveBeenCalledOnce();
});

test('shows the empty state after audit history has loaded', () => {
  render(
    <BoardAuditModal
      events={[]}
      error={null}
      hasMore={false}
      loading={false}
      onClose={vi.fn()}
      onLoadMore={vi.fn()}
    />
  );

  expect(screen.getByText('No recorded activity yet.')).toBeVisible();
});
