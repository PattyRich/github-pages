import React, {useEffect} from 'react';
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal"
import EditableInput from './EditableInput';

class TileModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      ...props.info 
    }

    this.inputState = this.inputState.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  inputState(e, target) {
		let stateChange = {}
    if (target === 'points') {
      if (isNaN(e.target.value)) {
        e.target.value = 0
      }
    }
		stateChange[target] = e.target.value
		this.setState(stateChange)
	}

  handleSave() {
    console.log('yea  ')
    this.props.change(this.props.cord[0], this.props.cord[1], this.state)
    this.props.handleClose()
  }

  handleClose() {
    this.props.handleClose()
  }

  render() {
    console.log(this.state)
    let disabled = this.props.privilage != 'admin'
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
          <EditableInput value={this.state.points} stateKey='points' change={this.inputState} title='Points' disabled={disabled} />
          <div className="form-check">
            {/* <input className="form-check-input" checked={this.state.checked} onChange={()=>this.setState({checked: !this.state.checked  })} type="checkbox" value="" id="flexCheckDefault"/> */}
            <label className="form-check-label" htmlFor="flexCheckDefault">
              Completed?
            </label>
          </div>
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