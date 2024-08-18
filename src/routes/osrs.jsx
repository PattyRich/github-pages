import React from 'react';
//import { Link } from "react-router-dom";
import './osrs.css';
import { loot } from '../looter/looter'
import { totalLooter} from '../looter/totalLooter'
import TotalLoot from '../components/TotalLoot'
import Plotly from 'plotly.js-dist-min'

export const cluesLvl = ['beginner', 'easy', 'medium', 'hard', 'elite', 'master'];
let failedImages = [];
const cluesData = {}
cluesLvl.forEach((lvl)=> cluesData[lvl] = null)

class Osrs extends React.Component {
  constructor() {
    super();
    this.state = {
      mode: 'cox',
      rewards: null,
      rolls: '',
      nothingCounter: 0,
      rewardList:[],
      rewardCount: 0,
      rewardCountConst: 0,
      points: 30000,
      pets: true,
      histogramData: [],
      simulations : 1000,
      fullRewards: false,
      fullLootRewards: [],
      icons: {},
      bosses: [],
      progress: 0,
	  	teamSize: 4,
      cms: false,
      invocation: 300,
      worstRewards: null,
      bestRewards: null,
			clue: 'beginner',
			hovering: -1,
      createData: {
      	bossName: 'Name me',
      	numItems: 1,
      	items: [{
      		name: 'Saradomin godsword',
      		rate: '1/100'
      	}],
      	pet: {
      		name: 'Baby mole',
      		rate: '1/5000'
      	}
      }
    };

		if (localStorage.getItem('bosses') !== undefined && localStorage.getItem('bosses') !== null && localStorage.getItem('bosses').length){
    	try {
    		this.state.bosses = JSON.parse(localStorage.getItem('bosses'))
    	} catch (err) {
    		console.log(err, 'error parsing bosses from cache')
    	}
    }

    this.onChangeValue = this.onChangeValue.bind(this);
    this.onChangeValueInput = this.onChangeValueInput.bind(this);
		this.go = this.go.bind(this);
		this.stopInterval = this.stopInterval.bind(this);
		this.graphSimulation = this.graphSimulation.bind(this);
		this.lootFunction = this.lootFunction.bind(this);
		this.saveBoss = this.saveBoss.bind(this);
		this.selectBoss = this.selectBoss.bind(this);
		this.deleteBoss = this.deleteBoss.bind(this);
		this.completion = this.completion.bind(this);
		this.clearData = this.clearData.bind(this);
		this.interval = null;
  }

  clearData = () => {
  	let rewardList = []
  	let rewardCount = 0
  	let rewards = null
  	let fullLootRewards = []
  	this.setState({ rewardList, rewardCount, rewards, fullLootRewards})
  }

  async onChangeValue(event) {
  	this.setState({'mode': event.target.value})
  	this.completion(event.target.value)
		//this.addIcons(event.target.value)
  }

	hoverHandler(bool) {
		this.setState({hovering: bool})
	}

  saveBoss(){
  	let index = this.state.bosses.findIndex(x => x.bossName === this.state.createData.bossName)
  	if (index > -1) {
  		return
  	}
  	let data = this.state.bosses
  	data.push(this.state.createData)
  	this.setState({'bosses': data})
  	localStorage.setItem('bosses', JSON.stringify(data))
  }

  selectBoss(name){
  	let index = this.state.bosses.findIndex(x => x.bossName === name)
  	this.setState({'createData': this.state.bosses[index]})
  }

  deleteBoss(){
  	let index = this.state.bosses.findIndex(x => x.bossName === this.state.createData.bossName)
  	if (index < 0) {
  		return
  	}
  	let data = this.state.bosses
  	data.splice(index,1)
  	this.setState({'bosses': data})
  	localStorage.setItem('bosses', JSON.stringify(data))
  }

  onChangeValueInput(state, event){
  	this.setState({
  		[state]: event.target.value
  	}, ()=> {
    	if (state == 'points' || state == 'teamSize' || state == 'invocation'){
  			this.completion()
  		}		
  	})
  }

  showPlotData(type){
  	if (type == 'best'){
  		this.setState({rewards: this.state.bestRewards})
  	} else {
  		this.setState({rewards: this.state.worstRewards})
  	}
  }

  clearPlots(){
  	Plotly.deleteTraces('histogram', 0)
  	Plotly.deleteTraces('scatter', 0)
		this.setState({bestRewards: null, worstRewards: null})
  }

  changeCreateData(thing, data, index){
  	let copy = {...this.state.createData}
  	if (thing === 'num'){
  		copy.numItems = data
  		if (copy.items.length >= copy.numItems) {
  			copy.items.pop()
  		} else {
  			copy.items.push({
  				name: '',
  				rate: '1/100'
  			})
  		}
  		this.setState({'createData': copy})
  	} else if(thing === 'name') {
  		copy.items[index].name = nameFilter(data)
  	}	else if (thing === 'rate') {
  		copy.items[index].rate = rateFilter(data)
  	} else if (thing === 'petRate') {
  		copy.pet.rate = rateFilter(data)
  	} else if (thing === 'petName') {
  		copy.pet.name = nameFilter(data)
  	} else if (thing ==='bossName') {
  		copy.bossName = data
  	}

  	function nameFilter(name){
  		return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  	}

  	function rateFilter(rate){
  		return rate.replace(/[^0-9/.]/g, '')
  	}

  	this.setState({'createData': copy})
  }


  //I USED AN API FOR THIS AT 1 POINT BUT IT WENT DOWN FREQUENTLY SO I DID LOCAL IMAGES
  //uncomment the addicons right below the go() function and let the getIcon call the python the python server to put images in the itemsToGet.json
  //then run getImage.py to get those images
  //create your own boss won't load the images unfortunatley :(
  async addIcons(mode, loot=null){
		  let iconClone = {...this.state.icons}

		  if (loot){
		  	let promiseArray = []
		  	for(let i=0; i< loot.length; i++){
		  		promiseArray.push(getIcon(loot[i].name))
		  	}		
		  	await Promise.all(promiseArray)
	  		this.setState({'icons': iconClone})		
	  		return 
		  }

		  if (mode === 'create') {
				let data = { ...this.state.createData }

				let promiseArray = []
		  	for(let i=0; i<data.items.length; i++){
		  		promiseArray.push(getIcon(data.items[i].name))
		  	}	

		  	if (data.pet) {
		  		promiseArray.push(getIcon(data.pet.name))
		  	}

				await Promise.all(promiseArray)
	  		this.setState({'icons': iconClone})		
	  		return  
	  	}

  		import('../looter/' + mode)
			.then(async (datax) => {
				let data = JSON.parse(JSON.stringify(datax)).data

				let promiseArray = []
		  	for(let i=0; i<data.items.length; i++){
		  		promiseArray.push(getIcon(data.items[i].name))
		  	}	

		  	promiseArray.push(getIcon(data.pet.name))

				await Promise.all(promiseArray)
	  		this.setState({'icons': iconClone})
			})

	  	function getIcon(name){
	  		let searchName = name
	  		if(name.includes('+')){
	  			searchName = name.replaceAll('+', '%2B')
	  		}
	  		return new Promise(async (resolve, reject) => {
		  		if (!iconClone[name]){
			  		try{
			  				iconClone[name] = 'loading'
			  				const response = await fetch(`https://api.osrsbox.com/items?where={ "name": "${searchName}", "duplicate": false }`);
							  const data = await response.json();
							  let icon = data._items[0].icon
							  iconClone[name] = icon
							  resolve()
						} catch(err) {
							if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
							    // dev code
							    try{
							    	  console.log(`localhost:5000/${encodeURI(name)}`)
											const response = await fetch(`http://localhost:5000/${encodeURI(name)}`, {
												mode: 'no-cors' // 'cors' by default
											  });
											console.log(`Added item ${name} to public assets folder. (should see on refresh)`)					    	
							    } catch (err) {
									console.log(err)
							    	console.log('Failed to add item to assets folder. Is the python server running????')
							    }	
							} 
							console.log(err)
							resolve()
						}
					}
					resolve()
	  		})
	  	}
  }

	async getClueData(type){
		const response = await fetch(`https://oldschool.runescape.wiki/w/Special:Browse?article=Reward_casket_(${type})&format=json`);
		const data = await response.json();
		cluesData[type] = data;
	}

  async simulate(){
  	if (this.interval){
  		clearInterval(this.interval)
  	}
	  let num = Number(this.state.rolls)
		if (num>1000){
			num = 1000
		}
  	this.setState({'rewardList': [], 'rewardCount': 0, 'rewardCountConst': num})
  	this.interval = setInterval(async ()=>{
  		let rewards = null
  		if (this.state.rewardCountConst) {
	  		rewards = await this.lootFunction(num, this.state.mode, this.state)

	  		this.setState({'rewardList': [rewards, ...this.state.rewardList], 'rewardCount': this.state.rewardCount + this.state.rewardCountConst })
	  	} 
  	}, 2000)
  }

  async go(){
		//this.addIcons(this.state.mode);
  	let rewards = []

		if (this.state.mode === 'clues') {
			if (!cluesData[this.state.clue]) {
				await this.getClueData(this.state.clue);
			}
		}
		rewards = await this.lootFunction(this.state.rolls, this.state.mode, this.state)
		this.setState({'rewards': rewards})		
		if (this.state.mode === 'create') {
			this.completion(this.state.mode);
		}

  	if (rewards && rewards.length === 0) {
  		this.setState({'nothingCounter': this.state.nothingCounter + 1})
  	} else {
  		this.setState({'nothingCounter': 0})
  	}
  }

  async graphSimulation(skipGraph = false){
  	let arr = []
		let items = []
		this.setState({progress: 0})
		this.setState({bestRewards: null, worstRewards: null})
		let best, worst
		for (let i=0; i<this.state.simulations; i++){
			if(i%(this.state.simulations/100) == 0){
				let progress = Math.round((i/this.state.simulations) * 100)
				this.setState({progress})
				await pause()
			}
			let x = await this.lootFunction('f', this.state.mode, this.state)
			if (!skipGraph){
				arr.push(x[x.length-1].kc)
				items.push(x.length)		
			}

			if (!best || x[x.length-1].kc < best[best.length-1].kc) {
				best = x
			}
			if (!worst || x[x.length-1].kc > worst[worst.length-1].kc) {
				worst = x
			}
		}

		this.setState({progress: 100, bestRewards: best, worstRewards: worst})

		if (skipGraph){
			return;
		}

		let trace = {
			x: arr,
			type: 'histogram'
		}

		let traceScatter = {
			x: arr,
			y: items,
			mode: 'markers',
			type: 'scatter'
		}

		let data = [trace]
		let data2 = [traceScatter]
		let layout = {
			xaxis: {
				title: {
					text: 'KC'
				}
			},
			yaxis: {
				title: {
					text: '# of people'
				}
			}
		}
		Plotly.newPlot('histogram', data, layout)		
		layout.yaxis.title.text = '# of items received'
		Plotly.newPlot('scatter', data2, layout)
  }

  async componentDidMount(){
	let availableItems = Object.keys(importAll(require.context('/public/assets', false, /\.(png)$/)));
	this.setState({availableItems: availableItems});
	this.completion();
  	// let completion = await (this.lootFunction(null, this.state.mode, {points: this.state.points, runCompletion: true, pets: this.state.pets, createData: this.state.createData, cms: this.state.cms}))
	// 	this.setState({'completion': completion})
		//this.addIcons(this.state.mode)
  }

  lootFunction(rolls, place, options){
  	let num = Number(rolls)

  	// if (this.state.mode === 'create') {
  	// 	//these have to be run late on create since we won't know them ahead of time
  	// 	// this.addIcons(this.state.mode)
  	// 	this.completion()
  	// }

  	if (num && rolls) {
  		return loot(num, place, {...options, cluesData})
  	} else if (num === 0) {
  		return loot('f', place, {...options, cluesData})
  	} else {
  		return loot(rolls, place, {...options, cluesData})
  	}
  }

  async completion(mode) {
  	//lootFunction will cause an infinite loop here
		let completion = await loot(null, mode || this.state.mode, {runCompletion: true, ...this.state})
		this.setState({'completion': completion})  
	}

	imageSrc(name) {
		name = this.state.availableItems.includes(name) ?
		`${process.env.PUBLIC_URL}/assets/${name}`
		:
		`https://oldschool.runescape.wiki/images/${name.replaceAll(' ', '_')}`;

		if (!failedImages.includes(name)){
			return name
		} else {
			return 'Lumbridge_Guide_icon.png'
		}
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
					<input type="radio" value="tob" name="" checked={this.state.mode === 'tob'} onChange={this.onChangeValue} /> ToB
					<input type="radio" value="toa" name="" checked={this.state.mode === 'toa'} onChange={this.onChangeValue} /> ToA
					<input type="radio" value="cg" name="" checked={this.state.mode === 'cg'} onChange={this.onChangeValue} /> Corrupted Gauntlet
			    <input type="radio" value="corp" name="" checked={this.state.mode === 'corp'} onChange={this.onChangeValue} /> Corp
		      <input type="radio" value="pnm" name="" checked={this.state.mode === 'pnm'} onChange={this.onChangeValue} /> Phosani's Nightmare
					<input type="radio" value="nex" name="" checked={this.state.mode === 'nex'} onChange={this.onChangeValue} /> Nex
		      <input type="radio" value="zulrah" name="" checked={this.state.mode === 'zulrah'} onChange={this.onChangeValue} /> Zulrah
		  		<input type="radio" value="vorkath" name="" checked={this.state.mode === 'vorkath'} onChange={this.onChangeValue} /> Vorkath
		    	<input type="radio" value="arma" name="" checked={this.state.mode === 'arma'} onChange={this.onChangeValue} /> Arma
		    	<input type="radio" value="bandos" name="" checked={this.state.mode === 'bandos'} onChange={this.onChangeValue} /> Bandos
		    	<input type="radio" value="sara" name="" checked={this.state.mode === 'sara'} onChange={this.onChangeValue} /> Sara
		    	<input type="radio" value="zammy" name="" checked={this.state.mode === 'zammy'} onChange={this.onChangeValue} /> Zammy
					<input type="radio" value="duke" name="" checked={this.state.mode === 'duke'} onChange={this.onChangeValue} /> Duke
					<input type="radio" value="leviathan" name="" checked={this.state.mode === 'leviathan'} onChange={this.onChangeValue} /> Leviathan
					<input type="radio" value="vardorvis" name="" checked={this.state.mode === 'vardorvis'} onChange={this.onChangeValue} /> Vardorvis
					<input type="radio" value="whisperer" name="" checked={this.state.mode === 'whisperer'} onChange={this.onChangeValue} /> Whisperer
		    	<input type="radio" value="create" name="" checked={this.state.mode === 'create'} onChange={this.onChangeValue} /> Create Your Own Boss
					<input type="radio" value="clues" name="" checked={this.state.mode === 'clues'} onChange={this.onChangeValue} /> Clues
		      </div>
					<div>
						{this.state.mode === 'clues' &&
						 cluesLvl.map((clue, i) => {
							return (<>
								<input type="radio" value={cluesLvl[i]} name="" checked={this.state.clue === cluesLvl[i]} onChange={(e) => this.onChangeValueInput('clue', e)} />
								{capitalizeFirstLetter(clue)}
								</>
							)})
						}
					</div>
		      {this.state.mode === 'create' ? 
			      <div style={{'margin': '30px'}}>
			      	<div style={{'padding': '10px', 'margin': '10px 0px', 'border' : 'solid black 2px'}}>
				      	Use fractions for rate or you will crash the webpage :)
	  						<br/>  		
	  						Item names must be spelled exactly how they are on the wiki	
	  						<br/>
								<button style={{'margin': '3px'}} onClick={this.saveBoss}> Save boss </button>
								<button style={{'margin': '3px'}} onClick={this.deleteBoss}> Delete boss </button>
								&nbsp; Boss name: <input type="text" value={this.state.createData.bossName} onChange={(e) => this.changeCreateData('bossName', e.target.value)}></input>
								&nbsp; Load previous boss.
								<select value='' onChange={(e) => this.selectBoss(e.target.value)}>
							    <option value=""></option> 
							    {this.state.bosses.map((boss, index) => {
					       		return (
					       			<option value={boss.bossName}>{boss.bossName}</option>
						       	)
								  })}							
								</select>
							</div>
				     	  Number of unique items you must obtain. &nbsp;
								<button onClick={()=> this.changeCreateData('num', this.state.createData.numItems -1)}> - </button>
				      	<span> {this.state.createData.numItems} </span>
				      	<button onClick={()=> this.changeCreateData('num', this.state.createData.numItems +1)}> + </button>
				      {this.state.createData.items.map((item, index) => {
			       		return (
			       			<div>
			       				Item {index+1}: Name: <input type="text" value={this.state.createData.items[index].name} onChange={(e) => this.changeCreateData('name', e.target.value, index)}/>
			       				&nbsp;
			       				Rate: <input type="text" value={this.state.createData.items[index].rate} onChange={(e) => this.changeCreateData('rate', e.target.value, index)}/>
			       			</div>
			       		)
					    })}
					    { this.state.pets ?
		       			<div>
		       				Pet: Name: <input type="text" value={this.state.createData.pet.name} onChange={(e) => this.changeCreateData('petName', e.target.value)}/>
		       				&nbsp;
		       				Rate: <input type="text" value={this.state.createData.pet.rate} onChange={(e) => this.changeCreateData('petRate', e.target.value)}/>
		       			</div> : null
		       		}
			    	</div> : null }
		      <label>Number of rolls (f or nothing for completion) </label>
	  			<input type="text" value={this.state.rolls} onChange={(e) => this.onChangeValueInput('rolls', e)}/>
					{ ['nex', 'tob'].includes(this.state.mode) && 
						<span>
								&nbsp; <label> Team size </label>
								<input type="text" value={this.state.teamSize} onChange={(e) => this.onChangeValueInput('teamSize', e)}/>
						</span>
					}
					{this.state.mode !== 'clues' &&
						<>
						<br/>
						Include pet for completion? <input type="checkbox" onChange={()=>{ this.setState({pets: !this.state.pets}); this.clearData(); } } checked={this.state.pets}/> 
						<br/>
						</>
					}
		      { this.state.mode === 'cox' ?
			      <span>
				     	<label>Number of cox points per raid </label>
			  			<input type="text" value={this.state.points} onChange={(e) => this.onChangeValueInput('points', e)}/>
		  				&nbsp; Challenge Mode? <input type="checkbox" onChange={()=>{ this.setState({cms: !this.state.cms}); } } checked={this.state.cms}/> 
		  			</span>
	  			: null }
	  			{ this.state.mode === 'toa' ?
			      <span>
				     	<label>Invocation Level (only accurate for 150-575)</label>
			  			&nbsp; <input type="text" value={this.state.invocation} onChange={(e) => this.onChangeValueInput('invocation', e)}/>
		  			</span>
	  			: null }
		      <br/>
		      <button onClick={this.go}> Go! </button>
		       &nbsp; or 
		      <button style={{margin: "10px"}} onClick={() => this.simulate()}> Simulate daily kc. (must be rolls &lt;= 1000) </button>
		      {	this.state.rewardList.length ? 
		      	<button style={{background: '#c90c1c'}} onClick={this.stopInterval}> Stop </button>
		      : null }
		      {	this.state.completion ? 
		      	<span> Average completion not including pet is: {this.state.completion} kc </span>
		      : null }
		      {	this.state.mode === 'create' ?
		      	<span> (This will be wrong if your rates are very common) </span>
		      : null }
		      <br/>
		      <span>
			     	<label> Plot results of a # of simulations  </label>
		  			<input type="text" value={this.state.simulations} onChange={(e) => this.onChangeValueInput('simulations', e)}/>
	  			</span>
	  			<button onClick={() => this.graphSimulation()}> Plot. </button>
	  			<button onClick={() => this.graphSimulation(true)}> Sim without graph. </button>
		      <div className="items">
		      	{this.state.rewards ? this.state.rewards.map((item, i) => {
		       		return (
		       			<div className="item"
								 onMouseEnter={()=>this.hoverHandler(i)}
								 onMouseLeave={()=>this.hoverHandler(-1)}
								>
		       				<a href={`https://oldschool.runescape.wiki/w/${item.name.split(' ').join('_')}`} target='_blank' rel='noreferrer'>
		       					<img src={this.imageSrc(`${item.name}.png`)} title={item.name} alt={item.name}
										  onError={({ currentTarget }) => {
												if(failedImages.indexOf(currentTarget.src) === -1) {
													failedImages.push(currentTarget.src)
												}
												currentTarget.onerror = null; // prevents looping
												currentTarget.src=this.imageSrc('Lumbridge_Guide_icon.png');
											}}
										/>
		       				</a>
										{this.state.hovering === i && this.state.mode == 'clues' ? `${item.kc}(${item.quantity})` : item.kc}
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
							       			{/*<img src={'data:image/png;base64,' + this.state.icons[item.name]} title={item.name} alt={item.name}></img>*/}
							       				<a href={`https://oldschool.runescape.wiki/w/${item.name.split(' ').join('_')}`} target='_blank' rel='noreferrer'>
							       					<img src={this.imageSrc(`${item.name}.png`)} title={item.name} alt={item.name}></img>
							       				</a>							       				
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
			  {this.state.progress > 0 && 
			  	<span>
			  		 { this.state.progress > 0 && <div style= {{'margin-left': '20px'}}> {this.state.progress}% done </div> }
		  			<button style={{'margin': '5px'}} onClick={() => this.showPlotData('best')}> Show best simulation. </button>
		  			<button style={{'margin': '5px'}} onClick={() => this.showPlotData('worst')}> Show worst simulation. </button>
		  			<button style={{'margin': '5px'}} onClick={() => this.clearPlots()}> Clear </button>
	  			</span>
			  }
			  <div id="histogram"> </div>
			  <div id="scatter"> </div>
      </div>
    );
  }
}

export default Osrs


function bossHelper(mode){
	switch (mode) {
	  case 'corp':
	  	return 'Corporeal Beast';
	    break;
	  case 'pnm':
	  	return 'Phosani\'s Nightmare';
	  	break;
	  case 'zulrah':
		  return 'Zulrah';
		  break;
		case 'vorkath':
			return 'Vorkath';
			break;
		case 'arma':
			return 'Kree\'arra';
			break;
		case 'bandos':
			return 'General Graardor';
			break;
		case 'zammy':
			return 'K\'ril Tsutsaroth';
			break;
		case 'sara':
			return 'Commander Zilyana';
			break;
	  default:
	  	return null
	}
}

const pause = () => {
  return new Promise(r => setTimeout(r, 0))
}

function importAll(r) {
  let images = {};
  r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
  return images;
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
