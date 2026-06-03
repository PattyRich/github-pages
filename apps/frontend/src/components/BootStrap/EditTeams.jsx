import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import BSButton from './Button';
import Modal from 'react-bootstrap/Modal';
import EditableInput from './EditableInput';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import './EditTeams.css';

const boardSizeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function EditTeams({ show, handleClose, handleSave, teams, passwordRequired, rows, columns, visibleRows }) {
  const [state, setState] = useState(() => {
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

  function inputState(e, target) {
    const value = Number(e.target.value);
    setState((currentState) => {
      const stateChange = {
        [target]: value,
      };
      if (target === 'columns') {
        stateChange.visibleRows = clampVisibleRows(currentState.visibleRows, value);
        stateChange.layeredBoard = stateChange.visibleRows < value;
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

  function editName(e, index) {
    const name = e.target.value;
    setState((currentState) => ({
      ...currentState,
      teams: currentState.teams.map((team, teamIndex) =>
        teamIndex === index ? { ...team, data: { ...team.data, name } } : team
      ),
    }));
  }

  function editPassword(e, index) {
    const password = e.target.value;
    setState((currentState) => ({
      ...currentState,
      teams: currentState.teams.map((team, teamIndex) =>
        teamIndex === index ? { ...team, data: { ...team.data, password } } : team
      ),
    }));
  }

  function save() {
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
      const newTeam = JSON.parse(JSON.stringify(currentState.teams[0]));
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

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">Edit Board</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant={'danger'}>
          ***NOTE removing teams or columns/rows will delete all their current data.
        </Alert>
        <Tabs
          activeKey={state.activeTab}
          onSelect={(key) => setState((currentState) => ({ ...currentState, activeTab: key }))}
          variant="pills"
          className="mb-3"
        >
          <Tab eventKey="board" title="Board">
            <div className="edit-board-layout">
              <div>
                <div className="edit-board-size-grid">
                  <Form.Group>
                    <Form.Label>Rows (up and down)</Form.Label>
                    <Form.Select
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
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Columns (left and right)</Form.Label>
                    <Form.Select
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
                    </Form.Select>
                  </Form.Group>
                </div>
                <Form.Check
                  type="switch"
                  id="layered-board-switch"
                  label="Layered board"
                  onChange={toggleLayeredBoard}
                  checked={state.layeredBoard}
                />
                <div className={`layer-control ${state.layeredBoard ? '' : 'is-disabled'}`}>
                  <Form.Label>
                    Visible rows: {state.layeredBoard ? state.visibleRows : state.columns} /{' '}
                    {state.columns}
                  </Form.Label>
                  <Form.Range
                    min={1}
                    max={state.columns}
                    value={state.layeredBoard ? state.visibleRows : state.columns}
                    disabled={!state.layeredBoard}
                    onChange={(e) => inputState(e, 'visibleRows')}
                  />
                  <div className="layer-help">
                    General users can only see tile details and submit proof for revealed rows.
                    Admins can still edit the full board.
                  </div>
                </div>
              </div>
              <LayerPreview
                rows={state.columns}
                columns={state.rows}
                visibleRows={state.layeredBoard ? state.visibleRows : state.columns}
              />
            </div>
          </Tab>
          <Tab eventKey="teams" title="Teams">
            <div className="flex-center edit-team-count">
              <BSButton click={removeTeam} text="-"></BSButton>
              <strong># of Teams: {state.teams.length}</strong>
              <BSButton click={addTeam} text="+"></BSButton>
            </div>
            {state.teams.map((team, i) => (
              <EditableInput
                key={i}
                title={`Team ${i + 1}`}
                change={(e) => editName(e, i)}
                value={team.data.name}
              />
            ))}
          </Tab>
          <Tab eventKey="access" title="Access">
            <div style={{ marginBottom: '15px' }}>
              <Form.Check
                type="switch"
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
                Team passwords are off. Anyone with the general board password can submit proof for
                any team.
              </Alert>
            )}
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={handleClose}>
          Close
        </Button>
        <Button variant="success" onClick={save}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default EditTeams;

function clampVisibleRows(value, rows) {
  if (value === null || value === undefined || value === '') {
    return rows;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return rows;
  }
  return Math.max(1, Math.min(parsed, rows));
}

function LayerPreview({ rows, columns, visibleRows }) {
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
