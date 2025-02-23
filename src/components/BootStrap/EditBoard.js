import React, {useEffect} from 'react';
import Modal from "react-bootstrap/Modal"
import Alert from "react-bootstrap/Alert"
import BoardTile from '../BoardTile';
import Button from '../../components/BootStrap/Button';

class EditBoard extends React.Component {
  constructor(props) {
    super(props);
    console.log(props)
    this.state = {
      cols: props.cols,
      rows: props.rows
    }
    this.handleSave = this.handleSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.changeNum = this.changeNum.bind(this)
    console.log(this.state)
  }


  changeNum(num, target){
    if (this.state[target] + num < 1 || this.state[target] + num > 11) {
      return;
    }
    let stateChange = {}
    stateChange[target] = this.state[target] + num
    this.setState(stateChange)
  }

  handleSave() {
    this.props.handleSave({cols: this.state.cols, rows: this.state.rows})
    this.props.handleClose()
  }

  handleClose() {
    this.props.handleClose()
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
          <Modal.Title id="contained-modal-title-vcenter" style={{'width': '100%  '}}>
            <div className='flex edit-teams' style={{'justifyContent': 'space-between'}}>
              <div> Edit Board </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={'danger'}>***NOTE removing rows or coloumns will delete all their data***</Alert>
          <div className="board-controls"> 
            <Button click={()=> this.changeNum(-1, 'rows')} text="-"></Button>
            Row : {this.state.rows}
            <Button click={()=> this.changeNum(1, 'rows')} text="+"></Button>
            <Button click={()=> this.changeNum(-1, 'cols')} text="-"></Button>
            Column : {this.state.cols}
            <Button click={()=> this.changeNum(1, 'cols')} text="+"></Button>
          </div>
          <div className='margin-15'>
							{[...Array(this.state.rows)].map((x,i) => (
								<span key={i} className='flex'>
										{[...Array(this.state.cols)].map((x,j) => (
											<BoardTile bare={true} key={j} br={this.state.cols === j+1} bb={this.state.rows=== i+1} />
										)
									)}
								</span>
								)
							)}
						</div>
        </Modal.Body>
        <Modal.Footer>
          <Button text="Close" variant="secondary" click={this.handleClose}/>
          <Button text="Save" variant="primary" click={this.handleSave}/>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default EditBoard