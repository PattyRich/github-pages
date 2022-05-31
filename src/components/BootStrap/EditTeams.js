import React, {useEffect} from 'react';
import Button from "react-bootstrap/Button";
import BSButton from './Button';
import Modal from "react-bootstrap/Modal"
import EditableInput from './EditableInput';

class EditTeams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      teams: JSON.parse(JSON.stringify(props.teams))
    }
    this.inputState = this.inputState.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.editName = this.editName.bind(this)
    this.removeTeam = this.removeTeam.bind(this)
    this.addTeam = this.addTeam.bind(this)
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

  handleSave() {
    this.props.handleSave(this.state.teams)
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
    console.log(this.state)
    return (
      <Modal
        show={this.props.show}
        onHide={this.handleClose}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter" style={{'width': '100%  '}}>
            <div className='flex edit-teams' style={{'justifyContent': 'space-between'}}>
              <div> Edit Teams </div>
              <div className='flex-center' style={{'marginRight': '200px', 'alignItems': 'center'}}>
                <BSButton click={this.removeTeam} text="-"></BSButton>
                  # of Teams : {this.state.teams.length}
                <BSButton click={this.addTeam} text="+"></BSButton>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ***NOTE removing teams will delete all their current data.
          <hr/>
          { this.state.teams.map((team, i) => {
            return <EditableInput key={i} change={(e) => this.editName(e, i)} value={team.data.name}/>
          })
          }
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