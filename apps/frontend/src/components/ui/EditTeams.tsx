import { useState } from 'react';
import type { ChangeEvent } from 'react';
import Alert from './Alert';
import EditableInput from './EditableInput';
import { RangeField, SelectField, SwitchField } from './FormControls';
import { ModalButton, ModalShell } from './ModalShell';
import Tabs from './Tabs';
import './EditTeams.css';

const boardSizeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const tabs = [
  { key: 'board', label: 'Board' },
  { key: 'teams', label: 'Teams' },
  { key: 'access', label: 'Access' },
] as const;

type ActiveTab = (typeof tabs)[number]['key'];
type BoardSizeTarget = 'columns' | 'rows' | 'visibleRows';

interface ReductionChange {
  from: number;
  label: string;
  to: number;
}

export interface TeamData {
  name: string;
  password?: string;
  teamData?: unknown;
}

export interface TeamInfo {
  data: TeamData;
  pointTotal?: number | string;
  team?: number | string;
}

interface EditTeamsProps {
  columns: number;
  handleClose: () => void;
  handleSave: (
    teams: TeamInfo[],
    passwordRequired: boolean,
    rows: number,
    columns: number,
    visibleRows: number
  ) => void;
  passwordRequired?: boolean;
  rows: number;
  show?: boolean;
  teams: TeamInfo[];
  visibleRows?: number | null;
}

interface EditTeamsState {
  activeTab: ActiveTab;
  columns: number;
  layeredBoard: boolean;
  passwordRequired: boolean;
  rows: number;
  teams: TeamInfo[];
  visibleRows: number;
}

function EditTeams({
  show,
  handleClose,
  handleSave,
  teams,
  passwordRequired,
  rows,
  columns,
  visibleRows,
}: EditTeamsProps) {
  const [confirmingReductions, setConfirmingReductions] = useState(false);
  const [state, setState] = useState<EditTeamsState>(() => {
    const rowCount = Number(rows);
    const columnCount = Number(columns);
    const visibleRowCount = clampVisibleRows(visibleRows, columnCount);
    return {
      teams: JSON.parse(JSON.stringify(teams)),
      passwordRequired: passwordRequired || false,
      columns: columnCount,
      rows: rowCount,
      visibleRows: visibleRowCount,
      layeredBoard: visibleRowCount < columnCount,
      activeTab: 'board',
    };
  });
  const reductionChanges = getReductionChanges(state, {
    boardColumns: Number(rows),
    boardRows: Number(columns),
    teams: teams.length,
  });
  const isConfirmingReductions = confirmingReductions && reductionChanges.length > 0;

  function inputState(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    target: BoardSizeTarget
  ) {
    const value = Number(e.target.value);
    setState((currentState) => {
      const stateChange: Partial<EditTeamsState> = { [target]: value };
      if (target === 'columns') {
        if (currentState.layeredBoard) {
          stateChange.visibleRows = clampVisibleRows(currentState.visibleRows, value);
          stateChange.layeredBoard = stateChange.visibleRows < value;
        } else {
          stateChange.visibleRows = value;
          stateChange.layeredBoard = false;
        }
      }
      if (target === 'visibleRows') {
        stateChange.visibleRows = clampVisibleRows(e.target.value, currentState.columns);
      }
      return {
        ...currentState,
        ...stateChange,
      };
    });
  }

  function editName(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) {
    const name = e.target.value;
    setState((currentState) => ({
      ...currentState,
      teams: currentState.teams.map((team, teamIndex) =>
        teamIndex === index ? { ...team, data: { ...team.data, name } } : team
      ),
    }));
  }

  function editPassword(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) {
    const password = e.target.value;
    setState((currentState) => ({
      ...currentState,
      teams: currentState.teams.map((team, teamIndex) =>
        teamIndex === index ? { ...team, data: { ...team.data, password } } : team
      ),
    }));
  }

  function save() {
    if (reductionChanges.length > 0 && !confirmingReductions) {
      setConfirmingReductions(true);
      return;
    }
    saveConfirmed();
  }

  function saveConfirmed() {
    const rowsToShow = state.layeredBoard ? state.visibleRows : state.columns;
    handleSave(state.teams, state.passwordRequired, state.rows, state.columns, rowsToShow);
    handleClose();
  }

  function removeTeam() {
    setState((currentState) => {
      if (currentState.teams.length <= 1) {
        return currentState;
      }
      return {
        ...currentState,
        teams: currentState.teams.slice(0, -1),
      };
    });
  }

  function addTeam() {
    setState((currentState) => {
      const newTeam = JSON.parse(JSON.stringify(currentState.teams[0])) as TeamInfo;
      newTeam.data.name = `team-${currentState.teams.length}`;
      return {
        ...currentState,
        teams: [...currentState.teams, newTeam],
      };
    });
  }

  function toggleLayeredBoard() {
    setState((currentState) => ({
      ...currentState,
      layeredBoard: !currentState.layeredBoard,
      visibleRows: currentState.layeredBoard
        ? currentState.columns
        : clampVisibleRows(currentState.visibleRows, currentState.columns),
    }));
  }

  function setActiveTab(activeTab: string) {
    setState((currentState) => ({ ...currentState, activeTab: activeTab as ActiveTab }));
  }

  return (
    <ModalShell
      show={show}
      titleId="edit-teams-title"
      title="Edit Board"
      onClose={handleClose}
      maxWidth="800px"
      footer={
        isConfirmingReductions ? (
          <>
            <ModalButton variant="secondary" onClick={() => setConfirmingReductions(false)}>
              Go Back
            </ModalButton>
            <ModalButton variant="danger" onClick={saveConfirmed}>
              Confirm Save
            </ModalButton>
          </>
        ) : (
          <>
            <ModalButton variant="danger" onClick={handleClose}>
              Close
            </ModalButton>
            <ModalButton variant="success" onClick={save}>
              Save
            </ModalButton>
          </>
        )
      }
    >
      {isConfirmingReductions ? (
        <div className="et-reduction-confirmation">
          <Alert variant="danger" role="alert">
            Saving this smaller setup will permanently delete board data outside the new size.
          </Alert>
          <ul className="et-reduction-list" aria-label="Reductions requiring confirmation">
            {reductionChanges.map((change) => (
              <li key={change.label} className="et-reduction-item">
                <span className="et-reduction-label">{change.label}</span>
                <span className="et-reduction-count">
                  {change.from} -&gt; {change.to}
                </span>
              </li>
            ))}
          </ul>
          <p className="et-reduction-copy">Choose Confirm Save only if you mean to trim them.</p>
        </div>
      ) : (
        <>
          <Alert variant="danger">
            ***NOTE removing teams or columns/rows will delete all their current data.
          </Alert>

          <Tabs
            className="et-tabs"
            items={tabs}
            activeKey={state.activeTab}
            onSelect={setActiveTab}
            ariaLabel="Edit board sections"
            idPrefix="edit-teams"
          />

          {state.activeTab === 'board' && (
            <div
              id="edit-teams-board-panel"
              role="tabpanel"
              aria-labelledby="edit-teams-board-tab"
              className="et-tab-panel"
            >
              <div className="edit-board-layout">
                <div>
                  <div className="edit-board-size-grid">
                    <SelectField
                      className="et-field"
                      label="Rows (up and down)"
                      onChange={(e) => {
                        inputState(e, 'columns');
                      }}
                      value={state.columns}
                    >
                      {boardSizeOptions.map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      className="et-field"
                      label="Columns (left and right)"
                      onChange={(e) => {
                        inputState(e, 'rows');
                      }}
                      value={state.rows}
                    >
                      {boardSizeOptions.map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <SwitchField
                    className="et-switch"
                    id="layered-board-switch"
                    label="Layered board"
                    onChange={toggleLayeredBoard}
                    checked={state.layeredBoard}
                  />
                  <div className={`layer-control ${state.layeredBoard ? '' : 'is-disabled'}`}>
                    <RangeField
                      label={`Visible rows: ${state.layeredBoard ? state.visibleRows : state.columns} / ${state.columns}`}
                      min={1}
                      max={state.columns}
                      value={state.layeredBoard ? state.visibleRows : state.columns}
                      disabled={!state.layeredBoard}
                      onChange={(e) => inputState(e, 'visibleRows')}
                      help={
                        <>
                          General users can only see tile details and submit proof for revealed
                          rows. Admins can still edit the full board.
                        </>
                      }
                    />
                  </div>
                </div>
                <LayerPreview
                  rows={state.columns}
                  columns={state.rows}
                  visibleRows={state.layeredBoard ? state.visibleRows : state.columns}
                />
              </div>
            </div>
          )}

          {state.activeTab === 'teams' && (
            <div
              id="edit-teams-teams-panel"
              role="tabpanel"
              aria-labelledby="edit-teams-teams-tab"
              className="et-tab-panel"
            >
              <div className="flex-center edit-team-count">
                <ModalButton variant="secondary" size="small" onClick={removeTeam}>
                  -
                </ModalButton>
                <strong># of Teams: {state.teams.length}</strong>
                <ModalButton variant="secondary" size="small" onClick={addTeam}>
                  +
                </ModalButton>
              </div>
              {state.teams.map((team, i) => (
                <EditableInput
                  key={i}
                  title={`Team ${i + 1}`}
                  change={(e) => editName(e, i)}
                  value={team.data.name}
                />
              ))}
            </div>
          )}

          {state.activeTab === 'access' && (
            <div
              id="edit-teams-access-panel"
              role="tabpanel"
              aria-labelledby="edit-teams-access-tab"
              className="et-tab-panel"
            >
              <div className="edit-access-control">
                <SwitchField
                  className="et-switch"
                  id="custom-switch"
                  label="Require teams to enter a password to make edits?"
                  onChange={() =>
                    setState((currentState) => ({
                      ...currentState,
                      passwordRequired: !currentState.passwordRequired,
                    }))
                  }
                  checked={state.passwordRequired}
                />
              </div>
              {state.passwordRequired ? (
                state.teams.map((team, i) => {
                  const password = team.data.password || '';
                  return (
                    <EditableInput
                      key={i}
                      title={`${team.data.name}'s password`}
                      change={(e) => editPassword(e, i)}
                      value={password}
                    />
                  );
                })
              ) : (
                <Alert variant="primary">
                  Team passwords are off. Anyone with the general board password can submit proof
                  for any team.
                </Alert>
              )}
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}

export default EditTeams;

function getReductionChanges(
  state: EditTeamsState,
  originalCounts: { boardColumns: number; boardRows: number; teams: number }
): ReductionChange[] {
  return [
    state.teams.length < originalCounts.teams
      ? { label: 'Teams', from: originalCounts.teams, to: state.teams.length }
      : null,
    state.columns < originalCounts.boardRows
      ? { label: 'Rows', from: originalCounts.boardRows, to: state.columns }
      : null,
    state.rows < originalCounts.boardColumns
      ? { label: 'Columns', from: originalCounts.boardColumns, to: state.rows }
      : null,
  ].filter((change): change is ReductionChange => change !== null);
}

function clampVisibleRows(value: number | string | null | undefined, rows: number): number {
  if (value === null || value === undefined || value === '') {
    return rows;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return rows;
  }
  return Math.max(1, Math.min(parsed, rows));
}

interface LayerPreviewProps {
  columns: number;
  rows: number;
  visibleRows: number;
}

function LayerPreview({ rows, columns, visibleRows }: LayerPreviewProps) {
  const cellSize = columns > 7 || rows > 7 ? 18 : 24;
  return (
    <div className="layer-preview">
      <div className="layer-preview-title">General view</div>
      <div className="layer-preview-board">
        {[...Array(Number(rows))].map((_, row) => (
          <div key={row} className="layer-preview-row">
            {[...Array(Number(columns))].map((_, col) => {
              const visible = row < visibleRows;
              return (
                <span
                  key={col}
                  title={visible ? 'Revealed' : 'Hidden'}
                  className={`layer-preview-cell ${visible ? 'is-visible' : 'is-hidden'}`}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="layer-preview-help">Hidden rows stay locked until an admin reveals more.</div>
    </div>
  );
}
