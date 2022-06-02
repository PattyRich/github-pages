import React from 'react';
//import { Link } from "react-router-dom";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

class EditableInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
    this.doAction = this.doAction.bind(this)
  }
  doAction(e) {
    if (!this.props.enterAction)
      return
    let code = e.keyCode || e .which
    //if enter was pressed
    if (code === 13) {
      this.props.enterAction()
    }
  }

  render() {
  	return (
      <div>
        <InputGroup className="mb-3" style={this.props.width ? {width : this.props.width} : {width: '500px'}}>
          <InputGroup.Text id="basic-addon1">{this.props.title}</InputGroup.Text>
          <FormControl
            placeholder={this.props.placeholder}
            as={this.props.textArea ? "textarea": undefined}
            value={this.props.value}
            aria-describedby="basic-addon1"
            onChange={(e)=>{this.props.change(e, this.props.stateKey)}}
            onKeyUp={(e)=>this.doAction(e)}
            disabled={this.props.disabled}
          />
        </InputGroup>
      </div>
    )
  }
}

export default EditableInput