import React from 'react';
//import { Link } from "react-router-dom";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

class EditableInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
  	return (
      <div>
        <InputGroup className="mb-3" style={this.props.width ? {width : this.props.width} : {width: '500px'}}>
          <InputGroup.Text id="basic-addon1">{this.props.title}</InputGroup.Text>
          <FormControl
            as={this.props.textArea ? "textarea": undefined}
            value={this.props.value}
            aria-describedby="basic-addon1"
            onChange={(e)=>{this.props.change(e, this.props.stateKey)}}
            disabled={this.props.disabled}
          />
        </InputGroup>
      </div>
    )
  }
}

export default EditableInput