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
        <Toast 
          onClose={this.props.onClose} 
          className={`d-inline-block m-1 osrs-toast-${this.props.variant || 'info'}`} 
          autohide 
          delay={this.props.timeout || 6000}
        >
          <Toast.Header>
            <strong className="me-auto">{this.props.title}</strong>
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
