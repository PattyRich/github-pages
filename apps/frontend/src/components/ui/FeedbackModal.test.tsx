import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchPost } from '../../utils/utils';
import FeedbackModal from './FeedbackModal';

vi.mock('../../utils/utils', () => ({
  fetchPost: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchPost).mockReset();
});

test('includes the board name with feedback from a bingo board', () => {
  render(<FeedbackModal boardName="Clan Bingo" handleClose={vi.fn()} />);

  fireEvent.change(screen.getByLabelText('Feedback'), {
    target: { value: 'A tile is stuck.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));

  expect(fetchPost).toHaveBeenCalledWith('feedback', {
    message: 'A tile is stuck.',
    boardName: 'Clan Bingo',
  });
});

test('does not add board context to feedback outside a bingo board', () => {
  render(<FeedbackModal handleClose={vi.fn()} />);

  fireEvent.change(screen.getByLabelText('Feedback'), {
    target: { value: 'General feedback.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));

  expect(fetchPost).toHaveBeenCalledWith('feedback', {
    message: 'General feedback.',
  });
});
