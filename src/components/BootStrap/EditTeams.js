import React, {useEffect} from 'react';
import Button from "react-bootstrap/Button";
import BSButton from './Button';
import Modal from "react-bootstrap/Modal"
import EditableInput from './EditableInput';
import Alert from "react-bootstrap/Alert"
import Form from 'react-bootstrap/Form';

const boardSizeOptions = [1,2,3,4,5,6,7,8,9,10];

class EditTeams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      teams: JSON.parse(JSON.stringify(props.teams)),
      passwordRequired: props.passwordRequired || false,
      columns: props.columns,
      rows: props.rows
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
		stateChange[target] = e.target.value
		this.setState(stateChange)
	}

  editName(e, index){
    let x = this.state.teams
    x[index].data.name = e.target.value
    this.setState({teams: x})
  }

  editPassword(e, index){
    let x = this.state.teams
    x[index].data.password = e.target.value
    this.setState({teams: x})
  }

  handleSave() {
    this.props.handleSave(this.state.teams, this.state.passwordRequired, this.state.rows, this.state.columns)
    this.props.handleClose()
  }

  handleClose() {
    this.props.handleClose()
  }

  removeTeam(){
    let x = this.state.teams
    x.pop()
    this.setState({teams: x})
  }
  
  addTeam(){
    let x = this.state.teams
    x.push(JSON.parse(JSON.stringify(x[0])))
    x[x.length-1].data.name = `team-${x.length-1}` 
    this.setState({teams: x})
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
            <div className='flex edit-teams' style={{'justifyContent': 'space-between'}}>
              <div className='flex-center' style={{'alignItems': 'center', 'width': '300px', 'marginRight': '50px'}}>
                <BSButton click={this.removeTeam} text="-"></BSButton>
                  # of Teams : {this.state.teams.length}
                <BSButton click={this.addTeam} text="+"></BSButton>
              </div>
              <div style={{'alignItems': 'center',  'paddingRight': '100px'}}>
                <div>
                  Columns (up and down)
                  <Form.Select onChange={(e) => {this.inputState(e, 'columns')}} value={this.state.columns} style={{'marginLeft': '10px'}}>
                    {boardSizeOptions.map(num => <option key={num} value={num}>{num}</option>)}
                  </Form.Select>
                </div>
                <div style={{'marginTop': '15px'}}>
                  Rows (left and right)
                  <Form.Select onChange={(e) => {this.inputState(e, 'rows')}} value={this.state.rows} style={{'marginLeft': '10px'}}>
                    {boardSizeOptions.map(num => <option key={num} value={num}>{num}</option>)}
                  </Form.Select>
                </div>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={'danger'}>***NOTE removing teams or columns/rows will delete all their current data.</Alert>
          <hr/>
          <div style={{marginBottom: '15px'}}> 
            <Form.Check // prettier-ignore
              type="switch"
              id="custom-switch"
              label="Require teams to enter a password to make edits?"
              onChange={() => this.setState({passwordRequired: !this.state.passwordRequired})}
              checked={this.state.passwordRequired}
            />
          </div>
          { this.state.teams.map((team, i) => {
            const password = team.data.password || ''
            return (
              <div key={i}>
                <EditableInput change={(e) => this.editName(e, i)} value={team.data.name}/>
                { this.state.passwordRequired && 
                  <EditableInput title={`${team.data.name}'s password`} change={(e) => this.editPassword(e, i)} value={password}/>
                }
              </div>
           )
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>Close</Button>
          <Button onClick={this.handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default EditTeams