import React from 'react';
//import { Link } from "react-router-dom";
import './BoardTile.css';
import Button from './BootStrap/Button'
import Modal from './BootStrap/TileModal'
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

class BoardTile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
			showModal: false
    }
		this.openModal = this.openModal.bind(this)
  }

	openModal(){
		if (!this.state.showModal) {
			this.setState({showModal: true})
		}
	}

  render() {
		let checked = this.props.teamInfo && this.props.teamInfo.checked
		let completeStyle = localStorage.getItem('completeStyle') === 'true'
		let showPoints = localStorage.getItem('showPoints') === 'true'
		let showTitleTile = localStorage.getItem('showTitleTile') === 'true'
		let style = this.props.dem ? {height: this.props.dem, width: this.props.dem} : {}
  	return (
			<>
			<OverlayTrigger
				placement={'top'}
				overlay={
					this.props.info && this.props.info.title ?
					<Tooltip>
						{this.props.info.title}
					</Tooltip>	
					:
					<></>
				}
			>
			<span className={`tile-wrapper ${!completeStyle && checked ? 'green-bg' : ''}`}>
				{checked && completeStyle && !this.props.bare &&
					<img 
						style={{'position': 'absolute', 'zIndex': '100'}} 
						src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='red' stroke-width='3'/><path d='M0 0 L100 100 ' stroke='red' stroke-width='3'/></svg>"
						onClick={this.openModal} 
					/>
				}
				{ this.props.info && this.props.info.image &&
					<img 
						className='bg-img' 
						style={{'opacity': this.props.info.image && this.props.info.image.opacity + '%', 'maxWidth': this.props.dem, 'maxHeight': !showTitleTile ? '80%' : this.props.dem}} 
						src={this.props.info.image && this.props.info.image.url} 
				/>
				}
				<div 
					onClick={this.openModal} 
					style={{
						...style,
						flexDirection: 'column',
						justifyContent : showTitleTile ? 'flex-end' : 'space-between'
					}} 
					className={`box-flex box-border ${this.props.br ? 'br' : ""} ${this.props.bb ? 'bb' : ""}`}
				> 
					{ !showTitleTile &&
						<div style={{height: '20%', overflow: 'hidden', textAlign: 'center', fontFamily: 'osrsFont'}}>
						{this.props.info.title}
						</div>
					}
					{!this.props.bare &&  
						<div style={{'width': '100%'}}>
							{ this.props.info && this.props.teamInfo && !showPoints &&
								<div style={{'justifyContent': 'flex-end', 'display': 'flex', 'height': '100%', 'alignItems': 'flex-end'}}>
									{this.props.teamInfo.currPoints} / {this.props.info.points}
								</div>
							}
							{ this.props.privilage ==='admin' &&
								<div style={{'justifyContent': 'flex-end', 'display': 'flex', 'height': '100%', 'alignItems': 'flex-end'}}>
									{this.props.info.points}
								</div>
							}
						</div>
					}	
				</div>
			</span>
			</OverlayTrigger>
				{ this.state.showModal && 
					<Modal 
						cord={this.props.cord} 
						change={this.props.change} 
						privilage={this.props.privilage} 
						info={this.props.info} 
						teamInfo={this.props.teamInfo}
						show={true} 
						handleClose={()=>this.setState({showModal: !this.state.showModal})}
						br = {this.props.br}
						bb = {this.props.bb}
					/>
				}
			</>
    )
  }
}

export default BoardTile