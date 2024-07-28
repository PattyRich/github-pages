import React, {useEffect} from 'react';
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal"
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
} from 'darkreader';

class SettingsModal extends React.Component {
  constructor(props) {
    super(props);
    //these should be named hide{Thing} too lazy to change
    const completeStyle = localStorage.getItem('completeStyle') === 'true';
    const showPoints = localStorage.getItem('showPoints') === 'true';
    const showTeamPoints = localStorage.getItem('showTeamPoints') === 'true';
    const showTitleTile = localStorage.getItem('showTitleTile') === 'true';
    const showFeedback = localStorage.getItem('showFeedback') === 'true';
    const darkMode = localStorage.getItem('darkMode') === 'true';
    this.state = { 
      completeStyle,
      showPoints,
      showTeamPoints,
      showTitleTile,
      showFeedback,
      darkMode
    }
    this.handleClose = this.handleClose.bind(this)
    this.setLocalStorage = this.setLocalStorage.bind(this)
    this.toggleCheck = this.toggleCheck.bind(this)
  }

  toggleCheck(key){
    let newVal = !this.state[key]
    let obj = {}
    obj[key] = newVal
    this.setState(obj)
    this.setLocalStorage(key, newVal)
    if (key === 'darkMode') {
      if (newVal) {
        enableDarkMode({
          brightness: 100,
          contrast: 90,
          sepia: 10,
        });
      } else {
        disableDarkMode();
      }
    }
  }

  setLocalStorage(key, value){
    localStorage.setItem(key, value);
  }

  handleClose() {
    this.props.handleClose()
  }

  render() {
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
              Hide current points on bingo board?
            </label>
          </div>
          <div className="form-check" style={{'marginTop': '15px'}}>
            <input className="form-check-input" checked={this.state.showTeamPoints} onChange={() => this.toggleCheck('showTeamPoints')} type="checkbox" id="flexCheckDefault3"/>
            <label className="form-check-label" htmlFor="flexCheckDefault3">
              Hide team points on team tabs?
            </label>
          </div>
          <div className="form-check" style={{'marginTop': '15px'}}>
            <input className="form-check-input" checked={this.state.showTitleTile} onChange={() => this.toggleCheck('showTitleTile')} type="checkbox" id="flexCheckDefault4"/>
            <label className="form-check-label" htmlFor="flexCheckDefault4">
              Hide tile title on board?
            </label>
          </div>
          <div className="form-check" style={{'marginTop': '15px'}}>
            <input className="form-check-input" checked={this.state.showFeedback} onChange={() => this.toggleCheck('showFeedback')} type="checkbox" id="flexCheckDefault5"/>
            <label className="form-check-label" htmlFor="flexCheckDefault5">
              Hide feedback button?
            </label>
          </div>
          <div className="form-check" style={{'marginTop': '15px'}}>
            <input className="form-check-input" checked={this.state.darkMode} onChange={() => this.toggleCheck('darkMode')} type="checkbox" id="flexCheckDefault6"/>
            <label className="form-check-label" htmlFor="flexCheckDefault6">
              Dark mode?
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
