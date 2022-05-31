import React, {useEffect} from 'react';
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal"
import EditableInput from './EditableInput';
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

class TileModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      ...props.info,
      ...props.teamInfo
    }
    console.log(props)
    this.inputState = this.inputState.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.toggleCheck = this.toggleCheck.bind(this)
  }

  inputState(e, target) {
		let stateChange = {}
    if (target === 'points' || target === 'currPoints') {
      if (isNaN(e.target.value)) {
        e.target.value = 0
      }
      if (target==='currPoints') {
        if (Number(e.target.value) > Number(this.state.points)) {
          e.target.value = this.state.points
        }
      }
    }
		stateChange[target] = e.target.value
		this.setState(stateChange)
	}

  toggleCheck() {
    this.setState({checked: !this.state.checked, currPoints: this.state.points})
  }

  handleSave() {
    let state = {...this.state}
    if (this.props.privilage === 'admin') {
      delete state.checked
      delete state.proof
      delete state.currPoints
    } else {
      state = {
        checked: state.checked,
        proof: state.proof,
        currPoints: state.currPoints
      }
    }
    this.props.change(this.props.cord[0], this.props.cord[1], this.state)
    this.props.handleClose()
  }

  handleClose() {
    this.props.handleClose()
  }

  render() {
    console.log(this.state)
    let disabled = this.props.privilage != 'admin'
    let generalDisabled = !disabled
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
            <EditableInput value={this.state.title} stateKey='title' change={this.inputState} title='Title' disabled={disabled}/>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EditableInput value={this.state.description} textArea={true} stateKey='description' change={this.inputState} title='Description' disabled={disabled} />
          <InputGroup style={{'width': '240px'}}>
            <InputGroup.Text id="basic-addon1">Points</InputGroup.Text> 
            <FormControl placeholder={!disabled ? '0' : null} value={this.state.currPoints} disabled={!disabled} onChange={(e) => this.inputState(e,'currPoints')} />
            <InputGroup.Text>/</InputGroup.Text>
            <FormControl value={this.state.points} disabled={disabled} onChange={(e) => this.inputState(e,'points')} />
          </InputGroup>
          { !generalDisabled && 
            <div className="form-check" style={{'marginTop': '15px'}}>
              <input className="form-check-input" disabled={generalDisabled} checked={this.state.checked} onChange={this.toggleCheck} type="checkbox" value="" id="flexCheckDefault"/>
              <label className="form-check-label" htmlFor="flexCheckDefault">
                Completed?
              </label>
            </div>
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

export default TileModal