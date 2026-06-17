import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import EditTeams from './EditTeams';

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
  const handleSave = vi.fn();
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

test('saves max visible rows so the board is effectively unlayered', () => {
  const props = renderEditTeams();

  fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  expect(props.handleSave).toHaveBeenCalledWith(teams, false, 5, 5, 5);
  expect(props.handleClose).toHaveBeenCalled();
});

test('turning off the layered switch saves all rows visible', () => {
  const props = renderEditTeams();

  fireEvent.click(screen.getByLabelText(/Layered board/i));
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  expect(props.handleSave).toHaveBeenCalledWith(teams, false, 5, 5, 5);
});

test('requires confirmation before saving fewer teams', () => {
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

  expect(props.handleSave).toHaveBeenCalledWith([twoTeams[0]], false, 5, 5, 2);
  expect(props.handleClose).toHaveBeenCalled();
});

test('requires confirmation before saving fewer rows or columns', () => {
  const props = renderEditTeams();

  fireEvent.change(screen.getByLabelText(/Rows \(up and down\)/i), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText(/Columns \(left and right\)/i), {
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

  expect(props.handleSave).toHaveBeenCalledWith(teams, false, 3, 4, 2);
});

test('keeps layered board off when rows are increased from an unlayered board', () => {
  const props = renderEditTeams({ visibleRows: 5 });

  expect(screen.getByLabelText(/Layered board/i)).not.toBeChecked();

  fireEvent.change(screen.getByLabelText(/Rows \(up and down\)/i), { target: { value: '6' } });

  expect(screen.getByLabelText(/Layered board/i)).not.toBeChecked();
  expect(screen.getByText(/Visible rows: 6 \/ 6/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

  expect(props.handleSave).toHaveBeenCalledWith(teams, false, 5, 6, 6);
});
