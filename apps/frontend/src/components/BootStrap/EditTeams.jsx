import React from 'react';
import Button from "react-bootstrap/Button";
import BSButton from './Button';
import Modal from "react-bootstrap/Modal"
import EditableInput from './EditableInput';
import Alert from "react-bootstrap/Alert"
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import './EditTeams.css';

const boardSizeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

class EditTeams extends React.Component {
  constructor(props) {
    super(props);
    const rows = Number(props.rows)
    const columns = Number(props.columns)
    const visibleRows = clampVisibleRows(props.visibleRows, columns)
    this.state = {
      teams: JSON.parse(JSON.stringify(props.teams)),
      passwordRequired: props.passwordRequired || false,
      columns,
      rows,
      visibleRows,
      layeredBoard: visibleRows < columns,
      activeTab: 'board'
    }
    this.inputState = this.inputState.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.editName = this.editName.bind(this)
    this.removeTeam = this.removeTeam.bind(this)
    this.addTeam = this.addTeam.bind(this)
    this.editPassword = this.editPassword.bind(this)
  }

  inputState(e, target) {
    let stateChange = {}
    stateChange[target] = Number(e.target.value)
    if (target === 'columns') {
      stateChange.visibleRows = clampVisibleRows(this.state.visibleRows, stateChange[target])
      stateChange.layeredBoard = stateChange.visibleRows < stateChange[target]
    }
    if (target === 'visibleRows') {
      stateChange.visibleRows = clampVisibleRows(e.target.value, this.state.columns)
      stateChange.layeredBoard = stateChange.visibleRows < this.state.columns
    }
    this.setState(stateChange)
  }

  editName(e, index) {
    let x = this.state.teams
    x[index].data.name = e.target.value
    this.setState({ teams: x })
  }

  editPassword(e, index) {
    let x = this.state.teams
    x[index].data.password = e.target.value
    this.setState({ teams: x })
  }

  handleSave() {
    const visibleRows = this.state.layeredBoard ? this.state.visibleRows : this.state.columns
    this.props.handleSave(this.state.teams, this.state.passwordRequired, this.state.rows, this.state.columns, visibleRows)
    this.props.handleClose()
  }

  handleClose() {
    this.props.handleClose()
  }

  removeTeam() {
    let x = this.state.teams
    if (x.length <= 1) {
      return
    }
    x.pop()
    this.setState({ teams: x })
  }

  addTeam() {
    let x = this.state.teams
    x.push(JSON.parse(JSON.stringify(x[0])))
    x[x.length - 1].data.name = `team-${x.length - 1}`
    this.setState({ teams: x })
  }

  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.handleClose}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Edit Board
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={'danger'}>***NOTE removing teams or columns/rows will delete all their current data.</Alert>
          <Tabs
            activeKey={this.state.activeTab}
            onSelect={(key) => this.setState({ activeTab: key })}
            variant="pills"
            className="mb-3"
          >
            <Tab eventKey="board" title="Board">
              <div className="edit-board-layout">
                <div>
                  <div className="edit-board-size-grid">
                    <Form.Group>
                      <Form.Label>Rows (up and down)</Form.Label>
                      <Form.Select onChange={(e) => { this.inputState(e, 'columns') }} value={this.state.columns}>
                        {boardSizeOptions.map(num => <option key={num} value={num}>{num}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Columns (left and right)</Form.Label>
                      <Form.Select onChange={(e) => { this.inputState(e, 'rows') }} value={this.state.rows}>
                        {boardSizeOptions.map(num => <option key={num} value={num}>{num}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <Form.Check
                    type="switch"
                    id="layered-board-switch"
                    label="Layered board"
                    onChange={() => this.setState((state) => ({
                      layeredBoard: !state.layeredBoard,
                      visibleRows: state.layeredBoard ? state.columns : clampVisibleRows(state.visibleRows, state.columns)
                    }))}
                    checked={this.state.layeredBoard}
                  />
                  <div className={`layer-control ${this.state.layeredBoard ? '' : 'is-disabled'}`}>
                    <Form.Label>Visible rows: {this.state.layeredBoard ? this.state.visibleRows : this.state.columns} / {this.state.columns}</Form.Label>
                    <Form.Range
                      min={1}
                      max={this.state.columns}
                      value={this.state.layeredBoard ? this.state.visibleRows : this.state.columns}
                      disabled={!this.state.layeredBoard}
                      onChange={(e) => this.inputState(e, 'visibleRows')}
                    />
                    <div className="layer-help">
                      General users can only see tile details and submit proof for revealed rows. Admins can still edit the full board.
                    </div>
                  </div>
                </div>
                <LayerPreview
                  rows={this.state.columns}
                  columns={this.state.rows}
                  visibleRows={this.state.layeredBoard ? this.state.visibleRows : this.state.columns}
                />
              </div>
            </Tab>
            <Tab eventKey="teams" title="Teams">
              <div className='flex-center edit-team-count'>
                <BSButton click={this.removeTeam} text="-"></BSButton>
                <strong># of Teams: {this.state.teams.length}</strong>
                <BSButton click={this.addTeam} text="+"></BSButton>
              </div>
              {this.state.teams.map((team, i) => (
                <EditableInput key={i} title={`Team ${i + 1}`} change={(e) => this.editName(e, i)} value={team.data.name} />
              ))}
            </Tab>
            <Tab eventKey="access" title="Access">
              <div style={{ marginBottom: '15px' }}>
                <Form.Check
                  type="switch"
                  id="custom-switch"
                  label="Require teams to enter a password to make edits?"
                  onChange={() => this.setState({ passwordRequired: !this.state.passwordRequired })}
                  checked={this.state.passwordRequired}
                />
              </div>
              {this.state.passwordRequired ? this.state.teams.map((team, i) => {
                const password = team.data.password || ''
                return (
                  <EditableInput key={i} title={`${team.data.name}'s password`} change={(e) => this.editPassword(e, i)} value={password} />
                )
              }) : (
                <Alert variant="primary">Team passwords are off. Anyone with the general board password can submit proof for any team.</Alert>
              )}
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={this.handleClose}>Close</Button>
          <Button variant="success" onClick={this.handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default EditTeams

function clampVisibleRows(value, rows) {
  if (value === null || value === undefined || value === '') {
    return rows
  }
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return rows
  }
  return Math.max(1, Math.min(parsed, rows))
}

function LayerPreview({ rows, columns, visibleRows }) {
  const cellSize = columns > 7 || rows > 7 ? 18 : 24
  return (
    <div className="layer-preview">
      <div className="layer-preview-title">General view</div>
      <div className="layer-preview-board">
        {[...Array(Number(rows))].map((_, row) => (
          <div key={row} className="layer-preview-row">
            {[...Array(Number(columns))].map((_, col) => {
              const visible = row < visibleRows
              return (
                <span
                  key={col}
                  title={visible ? 'Revealed' : 'Hidden'}
                  className={`layer-preview-cell ${visible ? 'is-visible' : 'is-hidden'}`}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="layer-preview-help">
        Hidden rows stay locked until an admin reveals more.
      </div>
    </div>
  )
}
