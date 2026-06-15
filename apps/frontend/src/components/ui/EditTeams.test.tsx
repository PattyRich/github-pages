import { fireEvent, render, screen } from '@testing-library/react';
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
