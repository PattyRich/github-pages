import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import EditTeams from './EditTeams';
import { SaveConflictError } from '../../utils/utils';

type EditTeamsProps = ComponentProps<typeof EditTeams>;

const teams = [
  {
    team: 0,
    data: {
      name: 'team-0',
      teamData: [],
    },
  },
] satisfies EditTeamsProps['teams'];

const twoTeams = [
  ...teams,
  {
    team: 1,
    data: {
      name: 'team-1',
      teamData: [],
    },
  },
] satisfies EditTeamsProps['teams'];

function renderEditTeams(overrides: Partial<EditTeamsProps> = {}) {
  const handleClose = vi.fn();
  const handleSave = vi.fn().mockResolvedValue(true);
  const props = {
    show: true,
    handleClose,
    handleSave,
    teams,
    passwordRequired: false,
    rows: 5,
    columns: 5,
    visibleRows: 2,
    ...overrides,
  } satisfies EditTeamsProps;

  render(<EditTeams {...props} />);
  return { ...props, handleClose, handleSave };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('keeps layered board controls active when visible rows are dragged to max', () => {
  renderEditTeams();

  const layeredSwitch = screen.getByLabelText(/Layered board/i);
  const visibleRows = screen.getByRole('slider');

  expect(layeredSwitch).toBeChecked();
  expect(visibleRows).toBeEnabled();

  fireEvent.change(visibleRows, { target: { value: '5' } });

  expect(layeredSwitch).toBeChecked();
  expect(visibleRows).toBeEnabled();
  expect(visibleRows).toHaveValue('5');
});

test('saves max visible rows so the board is effectively unlayered', async () => {
  const props = renderEditTeams();

  fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  expect(props.handleSave).toHaveBeenCalledWith(teams, false, 5, 5, 5, 0);
  await waitFor(() => expect(props.handleClose).toHaveBeenCalled());
});

test('keeps the board editor open when the parent reports a failed save', async () => {
  const handleSave = vi.fn().mockResolvedValue(false);
  const props = renderEditTeams({ handleSave });

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(handleSave).toHaveBeenCalled());
  expect(props.handleClose).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('shows a retryable error when the parent save rejects', async () => {
  const handleSave = vi.fn().mockRejectedValue(new Error('network error'));
  const props = renderEditTeams({ handleSave });

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not save the board/i);
  });
  expect(props.handleClose).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /Save/i })).toBeEnabled();
});

test('keeps settings drafts on conflict and offers to load the latest data', async () => {
  const handleSave = vi.fn().mockRejectedValue(new SaveConflictError('Board changed elsewhere.'));
  const onConflictReload = vi.fn().mockResolvedValue(true);
  const props = renderEditTeams({ handleSave, onConflictReload, boardSettingsRevision: 8 });

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/Board changed elsewhere/i);
  });
  expect(handleSave).toHaveBeenCalledWith(teams, false, 5, 5, 2, 8);
  expect(props.handleClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: /Discard draft and reload/i }));
  await waitFor(() => expect(onConflictReload).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(props.handleClose).toHaveBeenCalledTimes(1));
});

test('keeps settings drafts when loading the latest data fails', async () => {
  const handleSave = vi.fn().mockRejectedValue(new SaveConflictError('Board changed elsewhere.'));
  const onConflictReload = vi.fn().mockResolvedValue(false);
  const props = renderEditTeams({ handleSave, onConflictReload });
  fireEvent.click(screen.getByRole('tab', { name: /Teams/i }));
  const teamName = screen.getByDisplayValue('team-0');

  fireEvent.change(teamName, { target: { value: 'draft-team' } });
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Board changed/i));

  fireEvent.click(screen.getByRole('button', { name: /Discard draft and reload/i }));
  await waitFor(() => expect(onConflictReload).toHaveBeenCalledTimes(1));

  expect(props.handleClose).not.toHaveBeenCalled();
  expect(screen.getByDisplayValue('draft-team')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Discard draft and reload/i })).toBeEnabled();
});

test('disables duplicate board saves while the parent request is pending', async () => {
  let resolveSave!: (saved: boolean) => void;
  const handleSave = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        resolveSave = resolve;
      })
  );
  const props = renderEditTeams({ handleSave });
  const saveButton = screen.getByRole('button', { name: /Save/i });

  fireEvent.click(saveButton);
  fireEvent.click(saveButton);

  expect(handleSave).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled();
  expect(props.handleClose).not.toHaveBeenCalled();

  resolveSave(true);
  await waitFor(() => expect(props.handleClose).toHaveBeenCalledTimes(1));
});

test('turning off the layered switch saves all rows visible', async () => {
  const props = renderEditTeams();

  fireEvent.click(screen.getByLabelText(/Layered board/i));
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  expect(props.handleSave).toHaveBeenCalledWith(teams, false, 5, 5, 5, 0);
  await waitFor(() => expect(props.handleClose).toHaveBeenCalled());
});

test('requires confirmation before saving fewer teams', async () => {
  const props = renderEditTeams({ teams: twoTeams });

  fireEvent.click(screen.getByRole('tab', { name: /Teams/i }));
  fireEvent.click(screen.getByRole('button', { name: '-' }));
  fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

  const reductionList = screen.getByLabelText(/Reductions requiring confirmation/i);
  expect(screen.getByRole('alert')).toHaveTextContent(/permanently delete board data/i);
  expect(within(reductionList).getByText('Teams')).toBeInTheDocument();
  expect(within(reductionList).getByText('2 -> 1')).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: /Teams/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/# of Teams/i)).not.toBeInTheDocument();
  expect(props.handleSave).not.toHaveBeenCalled();
  expect(props.handleClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: /^Confirm Save$/i }));

  expect(props.handleSave).toHaveBeenCalledWith([twoTeams[0]], false, 5, 5, 2, 0);
  await waitFor(() => expect(props.handleClose).toHaveBeenCalled());
});

test('requires confirmation before saving fewer rows or columns', async () => {
  const props = renderEditTeams();

  fireEvent.change(screen.getByLabelText(/^Rows$/i), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText(/^Columns$/i), {
    target: { value: '3' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

  const reductionList = screen.getByLabelText(/Reductions requiring confirmation/i);
  expect(within(reductionList).getByText('Rows')).toBeInTheDocument();
  expect(within(reductionList).getByText('5 -> 4')).toBeInTheDocument();
  expect(within(reductionList).getByText('Columns')).toBeInTheDocument();
  expect(within(reductionList).getByText('5 -> 3')).toBeInTheDocument();
  expect(props.handleSave).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: /^Confirm Save$/i }));

  expect(props.handleSave).toHaveBeenCalledWith(teams, false, 3, 4, 2, 0);
  await waitFor(() => expect(props.handleClose).toHaveBeenCalled());
});

test('keeps layered board off when rows are increased from an unlayered board', async () => {
  const props = renderEditTeams({ visibleRows: 5 });

  expect(screen.getByLabelText(/Layered board/i)).not.toBeChecked();

  fireEvent.change(screen.getByLabelText(/^Rows$/i), { target: { value: '6' } });

  expect(screen.getByLabelText(/Layered board/i)).not.toBeChecked();
  expect(screen.getByText(/Visible rows: 6 \/ 6/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

  expect(props.handleSave).toHaveBeenCalledWith(teams, false, 5, 6, 6, 0);
  await waitFor(() => expect(props.handleClose).toHaveBeenCalled());
});
