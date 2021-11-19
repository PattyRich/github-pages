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
      rolls: '',
      error: false,
      nothingCounter: 0,
      rewardList:[],
      rewardCount: 0,
      rewardCountConst: 0,
      points: 30000,
      pets: true
    };
    this.onChangeValue = this.onChangeValue.bind(this);
    this.onChangeValueInput = this.onChangeValueInput.bind(this);
		this.go = this.go.bind(this);
		this.stopInterval = this.stopInterval.bind(this);
		this.interval = null;
  }

  async onChangeValue(event) {
  	this.setState({'mode': event.target.value})
		let completion = await (loot(null, event.target.value, {points: this.state.points, runCompletion: true, pets: this.state.pets}))
		this.setState({'completion': completion})
  }

  onChangeValueInput(state, event){
  	this.setState({[state]: event.target.value})
  }

  simulate(){
  	if (this.interval){
  		clearInterval(this.interval)
  	}
	  let num = Number(this.state.rolls)
		if (num>100){
			num = 100
		}
  	this.setState({'rewardList': [], 'rewardCount': 0, 'rewardCountConst': num})
  	this.interval = setInterval(async ()=>{
  		let rewards = null
  		if (this.state.rewardCountConst) {
	  		rewards = await (loot(num, this.state.mode, {points: this.state.points, pets: this.state.pets}))
	
	  		this.setState({'rewardList': [rewards, ...this.state.rewardList], 'rewardCount': this.state.rewardCount + this.state.rewardCountConst })
	  	} 
  	}, 2000)
  }

  async go(){
  	let num = Number(this.state.rolls)
  	let rewards = []
  	if (num) {
  		rewards = await (loot(num, this.state.mode, {points: this.state.points, pets: this.state.pets}))
  		this.setState({'rewards': rewards})
  	} else {
  		rewards = await (loot('f', this.state.mode, {points: this.state.points, pets: this.state.pets}))
  		this.setState({'rewards': rewards})
  	}

  	if (rewards && rewards.length === 0) {
  		this.setState({'nothingCounter': this.state.nothingCounter + 1})
  	} else {
  		this.setState({'nothingCounter': 0})
  	}
  }

  async componentDidMount(){
  	let completion = await (loot(null, this.state.mode, {points: this.state.points, runCompletion: true, pets: this.state.pets}))
		this.setState({'completion': completion})
  }

  stopInterval(){
		if (this.interval)
  		clearInterval(this.interval)  
  }

	componentWillUnmount(){
		this.stopInterval()
	}


  render() {
    return (
    	<div>
    		<div className="box">
		      <div>
		        <input type="radio" value="cox" name="" checked={this.state.mode === 'cox'} onChange={this.onChangeValue} /> Cox
		        <input type="radio" value="tob" name="" checked={this.state.mode === 'tob'} onChange={this.onChangeValue} /> Tob
		        <input type="radio" value="cg" name="" checked={this.state.mode === 'cg'} onChange={this.onChangeValue} /> Corrupted Gauntlet
			      <input type="radio" value="corp" name="" checked={this.state.mode === 'corp'} onChange={this.onChangeValue} /> Corp
		      </div>
		      <label>Number of rolls (f or nothing for completion) </label>
	  			<input type="text" value={this.state.rolls} onChange={(e) => this.onChangeValueInput('rolls', e)}/>
		      <br/>
		      Include pet for completion? <input type="checkbox" onChange={()=> this.setState({pets: !this.state.pets})} checked={this.state.pets}/> 
		      <br/>
		      { this.state.mode === 'cox' ?
			      <span>
				     	<label>Number of cox points per raid </label>
			  			<input type="text" value={this.state.points} onChange={(e) => this.onChangeValueInput('points', e)}/>
		  			</span>
	  			: null }
		      <br/>
		      <button onClick={this.go}> Go! </button>
		       &nbsp; or 
		      <button style={{margin: "10px"}} onClick={() => this.simulate()}> Simulate daily raids. (must be rolls &lt;= 100) </button>
		      {	this.state.rewardList.length ? 
		      	<button style={{background: '#c90c1c'}} onClick={this.stopInterval}> Stop </button>
		      : null }
		      {	this.state.completion ? 
		      	<span> Average completion without pet is: {this.state.completion} kc </span>
		      : null }
		      <div className="items">
		      	{this.state.rewards ? this.state.rewards.map(item => {
		       		return (
		       			<div className="item">
		       				<img src={`${process.env.PUBLIC_URL}/assets/${item.name}.gif`} alt={item.name}></img>
		       				{item.kc}
		       			</div>
		       		)
		      	}) : null}
		      	{this.state.rewards && this.state.rewards.length === 0 ? 'Nothing x' + this.state.nothingCounter : null}
		      </div>
		    </div>
		    { this.state.rewardList.length ? 
			    <div className="box">
			    	Overall KC: {this.state.rewardCount}
						<div className="day">
							{this.state.rewardList.length ? this.state.rewardList.map((day,index )=> {
								let date = new Date()
								date.setDate(date.getDate() + this.state.rewardList.length - (index+1));
								date = date.toLocaleString().split(',')[0]
								return (
									<div className="flexCol">
										{date}
										<div className="items">
							      	{day.length ? day.map(item => {
							       		return (
							       			<div className="item">
							       				<img src={`${process.env.PUBLIC_URL}/assets/${item.name}.gif`} alt={item.name}></img>
							       				{item.kc} ({(this.state.rewardCountConst * (this.state.rewardList.length - index)) - (this.state.rewardCountConst - item.kc)})
							       			</div>
							       		)
							      	}) : null}
							      </div>
									<hr/>
						      </div>
				      	)
							}) : null}
			      </div>
			    </div>
			  : null }
      </div>
    );
  }
}

export default Osrs