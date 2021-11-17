import React from 'react';
//import { Link } from "react-router-dom";
import './osrs.css';
import { loot } from '../looter/looter'
class Osrs extends React.Component {
  constructor() {
    super();
    this.state = {
      mode: 'cox',
      rewards: null,
      rolls: 'f',
      error: false,
      nothingCounter: 0
    };
    this.onChangeValue = this.onChangeValue.bind(this);
    this.onChangeValueInput = this.onChangeValueInput.bind(this);
		this.go = this.go.bind(this);
  }

  onChangeValue(event) {
  	this.setState({'mode': event.target.value})
  }

  onChangeValueInput(event){
  	this.setState({'rolls': event.target.value})
  }

  async go(){
  	let num = Number(this.state.rolls)
  	let rewards = []
  	if (num) {
  		rewards = await (loot(num, this.state.mode))
  		this.setState({'rewards': rewards})
  	} else {
  		rewards = await (loot('f', this.state.mode))
  		this.setState({'rewards': rewards})
  	}

  	if (rewards && rewards.length == 0) {
  		this.setState({'nothingCounter': this.state.nothingCounter + 1})
  	} else {
  		this.setState({'nothingCounter': 0})
  	}

  	console.log(this.state.rewards)
  }

  async componentDidMount(){
  }

  render() {
    return (
    	<div>
	      <div>
	        <input type="radio" value="cox" name="" checked={this.state.mode === 'cox'} onChange={this.onChangeValue} /> Cox
	        <input type="radio" value="tob" name="" checked={this.state.mode === 'tob'} onChange={this.onChangeValue} /> Tob
	        <input type="radio" value="cg" name="" checked={this.state.mode === 'cg'} onChange={this.onChangeValue} /> Corrupted Gauntlet
	      </div>
	      <label>Number of rolls (f or nothing for completion)</label>
  			<input type="text" onChange={this.onChangeValueInput} id="fname" name="fname"/>
	      <br/>
	      <button onClick={this.go}> Go! </button>
	      <div className="items">
	      	{this.state.rewards ? this.state.rewards.map(item => {
	       		return (
	       			<div className="item">
	       				<img src={`${process.env.PUBLIC_URL}/assets/${item.name}.gif`}></img>
	       				{item.kc}
	       			</div>
	       		)
	      	}) : null}
	      	{this.state.rewards && this.state.rewards.length === 0 ? 'Nothing x' + this.state.nothingCounter : null}
	      </div>
      </div>
    );
  }
}

export default Osrs