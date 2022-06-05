import React from 'react';
//import { Link } from "react-router-dom";
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer';

class ToastCls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
  	return ( 
      <ToastContainer className="p-3" position={this.props.position}>
        <Toast onClose={this.props.onClose} className="d-inline-block m-1" bg={this.props.variant} autohide delay={this.props.timeout || 6000}>
          <Toast.Header>
            <img src="holder.js/20x20?text=%20" className="rounded me-2" alt="" />
            <strong className="me-auto">{this.props.title}</strong>
            {/* <small>11 mins ago</small> */}
          </Toast.Header>
          <Toast.Body className={this.props.variant === 'Dark' && 'text-white'}>
            {this.props.message}
          </Toast.Body>
        </Toast>
      </ToastContainer> 

      )
  }
}

export default ToastCls