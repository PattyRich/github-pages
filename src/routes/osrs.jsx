import React from 'react';
//import { Link } from "react-router-dom";
import './osrs.css';
import { loot } from '../looter/looter'
class Osrs extends React.Component {
  constructor() {
    super();
    this.state = {
      mode: 'cox',
      rewards: null
    };
    this.onChangeValue = this.onChangeValue.bind(this);
		this.go = this.go.bind(this);
  }

  onChangeValue(event) {
  	this.setState({'mode': event.target.value})
  }

  async go(){
  	let rewards = await (loot('f', this.state.mode))
  	this.setState({'rewards': rewards})
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
	      </div>
      </div>
    );
  }
}

export default Osrs