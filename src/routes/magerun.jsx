import React from 'react';
//import { Link } from "react-router-dom";
//https://github.com/devqhp/devqhp.github.io/blob/master/osrs/sotetseg/sotetseg.js
//https://forum.ikov.io/profile/82597-rational/content/page/2/ olm picture
//olm room 10/18
import './magerun.css';

class Magerun extends React.Component {
  constructor() {
    super();
    this.state = {
    	widthAmt: 17,
    	heightAmt: 10,
    	headDirection: 'olm-center',
    	xpDrops: []
    }
	  this.resize = this.resize.bind(this);
	  this.canvas = React.createRef();
	  this.canvas2 = React.createRef();
	  this.ctx = null;
	  this.player = {x:0, y:0}
	  this.interval = null;
	  this.destination = {x:0, y:0}
	  this.destinationOnTick = {x: 0, y: 0}
	  this.offset = 300
	  this.olm = {
	  	tta: 4
	  }
	  this.oneTickBlock = false;
	  this.playerAttackcd = 0
	  this.playerAttack = null;
	  this.playerAttackQueued = false;
	  this.olmAttack = null;
		this.resize = this.resize.bind(this);
		this.drawTiles = this.drawTiles.bind(this);
  	this.getTile = this.getTile.bind(this);
  	this.attackWillHit = false;
  }


  resize() {
		let viewport_height = window.innerHeight
		let viewport_width = window.innerWidth

		let ratio = viewport_width/viewport_height
		let height, width;

		if (ratio > 1.7){
			height = viewport_height
			width = height*1.7
		} else {
			width = viewport_width
			height = width/1.7
		}

		if (height < 300){
			height = 300
			width = height*1.7
		}

		this.tileSize = height/this.state.heightAmt
		height += this.offset

		this.canvas.current.height = height
		this.canvas.current.width = width
		this.canvas2.current.height = height
		this.canvas2.current.width = width
		this.drawBoard()
  }

  drawBoard(){
   	this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height) 
    this.drawTiles()
    this.drawChar()
    this.drawDesination()
    this.drawClaw()
    if (this.drawStar){
    	this.drawStar = false;
    	if (this.attackWillHit){
    		drawStar(170,200,20,30,25,this.ctx,'red')
    	} else {
				drawStar(170,200,20,30,25,this.ctx,'blue')
    	}
    }
  }

  drawClaw(){
  	this.ctx.fillStyle = '#00FFEE'
    this.ctx.fillRect(25,75, 300, 200) 
    this.ctx.fillStyle = '#000000'
    this.ctx.font = '40px serif'
    this.ctx.fillText('Mage hand', 85, 150);
  }

  drawChar(){
  	this.ctx.strokeStyle = '#00FFEE'
  	this.ctx.strokeRect(this.player.x*this.tileSize, this.offset + this.player.y*this.tileSize, this.tileSize, this.tileSize)
  }

  drawDesination() {
  	if (this.destinationOnTick){
  		if (this.player.x !== this.destinationOnTick.x || this.player.y !== this.destinationOnTick.y){
	  		this.ctx.strokeStyle = '#FFFF00'
	  		this.ctx.strokeRect(this.destinationOnTick.x*this.tileSize, this.offset+ this.destinationOnTick.y*this.tileSize, this.tileSize, this.tileSize)
	  	}
  	} else if (this.destination) {
	  	if (this.player.x !== this.destination.x || this.player.y !== this.destination.y){
	  		this.ctx.strokeStyle = '#FFFF00'
	  		this.ctx.strokeRect(this.destination.x*this.tileSize, this.offset + this.destination.y*this.tileSize, this.tileSize, this.tileSize)
	  	}
  	}
  }

 	drawTiles(){
 		this.ctx.strokeStyle = 'grey'
 		for(let i=0;i<this.state.heightAmt; i++){
 			for(let j=0; j<this.state.widthAmt; j++){
 				this.ctx.strokeRect(j*this.tileSize, this.offset + i*this.tileSize, this.tileSize, this.tileSize)
 			}
 		}
 		//safespots
 		this.ctx.strokeStyle = 'red'
 		for (let i = 0; i<= 1; i++){
 		 	this.ctx.strokeRect(1*this.tileSize, this.offset + i*this.tileSize, this.tileSize, this.tileSize)
	 		this.ctx.strokeRect(6*this.tileSize, this.offset + i*this.tileSize, this.tileSize, this.tileSize)
	 		this.ctx.strokeRect(10*this.tileSize, this.offset + i*this.tileSize, this.tileSize, this.tileSize)
	 		this.ctx.strokeRect(13*this.tileSize, this.offset + i*this.tileSize, this.tileSize, this.tileSize)	
 		}
 	}

 	getTile(e){
 		let x = e.offsetX
 		let y = e.offsetY - this.offset
 		let tile_x = Math.floor(x / this.tileSize);
		let tile_y = Math.floor(y / this.tileSize);	

 		if ((e.offsetX > 25 && e.offsetX <325) && (e.offsetY> 75 && e.offsetY < 275)){
 			this.attackLoop = true;
 			if (this.player.x >=13) {
 				return this.player.x%2 == 0 ? {x: 12, y:this.player.y} : {x: 11, y:this.player.y}
 			} else {
 				return { x: this.player.x, y: this.player.y };	
 			}
 		} else {
 			this.attackLoop = false
 		}

		if (tile_y <0) {
			tile_y = 0
		} 
		if (tile_y > this.state.heightAmt){
			tile_y = this.state.heightAmt-1
		}
		return { x: tile_x, y: tile_y };	
 	}

 	updateDestinationAfterTimeout(){
 		if (this.destinationOnTick){
 			this.destination = JSON.parse(JSON.stringify(this.destinationOnTick))
 			this.destinationOnTick = null;
 		}
 	}

 	moveChar(){
 		if (!this.destination) {
 			return
 		}

 		let xdiff = this.destination.x - this.player.x
 		let ydiff = this.destination.y - this.player.y
 		let xdiffAbs = Math.abs(xdiff)
 		let ydiffAbs = Math.abs(ydiff)
 		let absDiff = xdiffAbs-ydiffAbs
 		if (absDiff>=2){
 			if (xdiffAbs > ydiffAbs){
 				let newx = this.player.x + (this.destination.x - this.player.x > 0 ? 2 : -2)
 				this.player = {x: newx, y: this.player.y}
 			} else {
 				let newy = this.player.y + (this.destination.y - this.player.y > 0 ? 2 : -2)
 				this.player = {x: this.player.x, y: newy}
 			}
 		} else {
 			let newx = xdiff
 			if (xdiff > 2){
 				newx = 2
 			}
 			if (xdiff < -2 ){
 				newx = -2
 			}
  		let newy = ydiff
 			if (ydiff > 2){
 				newy = 2
 			}
 			if (ydiff < -2 ){
 				newy = -2
 			}
 			if(absDiff === 1  && (ydiffAbs >=2 && xdiffAbs >=2)){
 				if (newy > 0){
 					newy -=1
 				}
 				if (newy <0){
 					newy +=1
 				}
 			}
  		if(absDiff === -1  && (ydiffAbs >=2 && xdiffAbs >=2)){
 				if (newx > 0){
 					newx -=1
 				}
 				if (newx <0){
 					newx +=1
 				}
 			}
 			
 			this.player = {x: this.player.x + newx, y: this.player.y + newy}
 			if (xdiff==0 && ydiff == 0) {
 				this.destination = null;
 			}
 		}
 	}

 	olmAction(){
 		this.olm.tta = this.olm.tta - 1
 		if (this.olm.tta == 0) {
 			this.olm.tta = 4
 			if (this.state.headDirection == 'olm-left') {
 				if (this.player.x <= 1){
 					//olm attacks you
 					this.olmAttack = {x: this.canvas.current.width/2 , y: this.offset -150}
 				}	else if (this.player.x > 1 && this.player.x <=8){
 					if (Math.floor(Math.random() * 2) == 1){
						this.setState({headDirection: 'olm-center'})
					} else {
 						this.olmAttack = {x: this.canvas.current.width/2 , y: this.offset -150}
					} 
 				} else if(this.player.x >= 9 && this.player.x <=12){
					this.setState({headDirection: 'olm-center'})
				} else {
 					this.setState({headDirection: 'olm-right'})
 				}
 			} else if (this.state.headDirection == 'olm-center') {
 				if (this.player.x > 1 && this.player.x <=12){
 					//olm attacks you
 					this.olmAttack = {x: this.canvas.current.width/2 , y: this.offset-150}
 				}	else if (this.player.x <= 1){
 					this.setState({headDirection: 'olm-left'})
 				} else {
 					this.setState({headDirection: 'olm-right'})
 				}
	 		} else {
				if (this.player.x >= 13){
					//olm attacks you
					this.olmAttack = {x: this.canvas.current.width/2 , y: this.offset-150}
				}	else if (this.player.x > 1 && this.player.x <=12){
					if (this.player.x <=6){
						if (this.attackWillHit) {
							this.setState({headDirection: 'olm-left'})
						} else {
							this.setState({headDirection: 'olm-center'})
 						}
					} else {
						if (Math.floor(Math.random() * 2) == 1){
							this.setState({headDirection: 'olm-center'})
						} else {
							this.olmAttack = {x: this.canvas.current.width/2 , y: this.offset-150}
						}
					}
				} else {
					this.setState({headDirection: 'olm-left'})
				}
 			}
 			this.attackWillHit = false;
 		}
 	}

 	playerAttackFunc(){
 		if (this.attackLoop && this.player.x <=12 && this.playerAttackcd <=0){
 			let audio = new Audio(`${process.env.PUBLIC_URL}/assets/trident.mp3`)
 				audio.addEventListener('loadeddata', () => {
 				audio.play()
 			})
 			let coords = this.playerCords()
 			if (Math.floor(Math.random() * 5) == 4){
 				this.attackWillHit = false;
 			} else {
 				this.attackWillHit = true;
 				this.procXp()
 			}
 			this.playerAttack = {x: coords.x, y: coords.y}
 			this.playerAttackcd = 4
 		}
 	}

 	procXp(){
 		let xpDrops = [...this.state.xpDrops]
 		xpDrops.push('sdafijadsfjsal')
 		this.setState({xpDrops: xpDrops})
 		setTimeout(()=>{
 			let copy = [...this.state.xpDrops]
 			copy.shift()
 			this.setState({xpDrops: copy})
 		},4000)
 	}

 	gameTick(){
 		this.playerAttackcd -=1
 		this.olmAction()
 		this.moveChar()
 		this.playerAttackFunc()
 		this.drawBoard()
 	}

 	animate(){
 		this.ctx2.clearRect(0,0,this.canvas2.current.width, this.canvas2.current.height)
 		requestAnimationFrame(()=> this.animate())
 		try{
  		if (this.olmAttack){
	 			this.ctx2.beginPath()
	 			this.olmAttack = approachTarget(this.olmAttack, this.playerCords())
	 			this.ctx2.arc(this.olmAttack.x, this.olmAttack.y, 10, 0, Math.PI*2, false )
	 			this.ctx2.fillStyle = 'green'
	 			this.ctx2.fill()
 			}
 		}	catch (err) {
 		}	

 		try {
			this.ctx2.beginPath()
			this.playerAttack = approachTarget(this.playerAttack, {x: 175, y: 200})
			if(this.playerAttack == null) {
				this.drawStar = true;
				if (this.attackWillHit){
					drawStar(170,200,20,30,25,this.ctx,'red')
				} else {
					drawStar(170,200,20,30,25,this.ctx,'blue')
				}
			}
			this.ctx2.arc(this.playerAttack.x, this.playerAttack.y, 10, 0, Math.PI*2, false )
			this.ctx2.fillStyle = 'blue'
			this.ctx2.fill()
 		} catch (err) {
 		}
	 }

 	playerCords(){
 		return ({x: this.player.x * this.tileSize + this.tileSize/2, y: this.offset + this.player.y * this.tileSize + this.tileSize/2})
 	}

  componentDidMount(){
  	const context = this.canvas.current.getContext('2d')
  	this.ctx = context;
  	const context2 = this.canvas2.current.getContext('2d')
  	this.ctx2 = context2;    
  	this.resize()
    this.drawBoard()
    window.addEventListener('resize', this.resize)
    window.addEventListener('mousedown', (e) => {
    	this.destinationOnTick = this.getTile(e)
    	this.drawBoard()
    	//this simulates ping
    	setTimeout(()=>{
    		this.updateDestinationAfterTimeout()
    	},75)
		});
    this.interval = setInterval(()=> {
    	this.gameTick()
    },600)
    this.animate()
  }

	componentWillUnmount(){
		if (this.interval){
			clearInterval(this.interval)
		}
	}


  render() {
    return (
    	<div id="background">
	    	<div className="parent">
	    	  <img className={`olm ${this.state.headDirection} child`} src={`${process.env.PUBLIC_URL}/assets/olm.png`} height={this.offset-20}/>
						{this.state.xpDrops.map(() => {
		       		return (
	    	  			<div style={{'color': 'white'}} className='fade-out child2'>
	    	  				<img className='' src={`${process.env.PUBLIC_URL}/assets/magic.png`} height={20}/>
			       			123
			       		</div>
			       	)
						})}		
	    	</div>
    		<canvas id='olm-room' ref={this.canvas} />    		
    		<canvas id='projectiles' ref={this.canvas2} />
    	</div>
    );
  }
}

export default Magerun

function approachTarget(object, target){
	let xdiff = Math.abs(object.x - target.x)
	let ydiff = Math.abs(object.y - target.y)

	if (object.x < 0){
		return object
	}

	if (xdiff <30 && ydiff <30){
		return null
	}

	let ratiox = xdiff / ydiff
	let ratioy = ydiff / xdiff

	let movement = 4

	ratiox *= movement
	ratioy *= movement

	ratiox = ratiox < 1 ? .33 : ratiox
	ratioy = ratioy < 1 ? .33 : ratioy

	ratiox = ratiox > movement ? movement : ratiox
	ratioy = ratioy > movement ? movement : ratioy

	if (object.x > target.x){
		object.x -=ratiox
	} else if (object.x < target.x){
		object.x +=ratiox
	} 
	if (object.y > target.y){
		object.y -=ratioy
	} else if (object.y < target.y){
		object.y +=ratioy
	} 


	return object
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius, ctx, color) {
    var rot = Math.PI / 2 * 3;
    var x = cx;
    var y = cy;
    var step = Math.PI / spikes;

    ctx.strokeSyle = "#000";
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y)
        rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath();
    ctx.strokeStyle=color;
    ctx.stroke();
    ctx.fillStyle=color;
    ctx.fill();

}