import React from 'react';
//import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";

class BSButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
  	return (
      <div>
        <Button style={this.props.style} disabled={this.props.disabled} onClick={this.props.click} variant={this.props.variant || "outline-secondary"}>{this.props.text}</Button>
      </div>
    )
  }
}

export default BSButton