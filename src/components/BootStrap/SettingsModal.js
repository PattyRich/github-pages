import React, {useEffect} from 'react';
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal"
import EditableInput from './EditableInput';
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

class SettingsModal extends React.Component {
  constructor(props) {
    super(props);
    const completeStyle = localStorage.getItem('completeStyle') === 'true';
    const showPoints = localStorage.getItem('showPoints') === 'true';
    const showTeamPoints = localStorage.getItem('showTeamPoints') === 'true';
    this.state = { 
      completeStyle,
      showPoints,
      showTeamPoints
    }
    this.handleClose = this.handleClose.bind(this)
    this.setLocalStorage = this.setLocalStorage.bind(this)
    this.toggleCheck = this.toggleCheck.bind(this)
  }

  toggleCheck(key){
    console.log(key)
    let newVal = !this.state[key]
    let obj = {}
    obj[key] = newVal
    this.setState(obj)
    this.setLocalStorage(key, newVal)
  }

  setLocalStorage(key, value){
    localStorage.setItem(key, value);
  }

  handleClose() {
    this.props.handleClose()
  }

  render() {
    console.log(this.state)
    return (
      <Modal
        show={true}
        onHide={this.handleClose}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-check" style={{'marginTop': '15px'}}>
            <input className="form-check-input" checked={this.state.completeStyle} onChange={() => this.toggleCheck('completeStyle')} type="checkbox" id="flexCheckDefault"/>
            <label className="form-check-label" htmlFor="flexCheckDefault">
              Use alternative tile complete style?
            </label>
          </div>          
          <div className="form-check" style={{'marginTop': '15px'}}>
            <input className="form-check-input" checked={this.state.showPoints} onChange={() => this.toggleCheck('showPoints')} type="checkbox" id="flexCheckDefault2"/>
            <label className="form-check-label" htmlFor="flexCheckDefault2">
              Show current points on bingo board?
            </label>
          </div>
          <div className="form-check" style={{'marginTop': '15px'}}>
            <input className="form-check-input" checked={this.state.showTeamPoints} onChange={() => this.toggleCheck('showTeamPoints')} type="checkbox" id="flexCheckDefault3"/>
            <label className="form-check-label" htmlFor="flexCheckDefault3">
              Show team points on team tabs?
            </label>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default SettingsModal
