import React from 'react';
//import { Link } from "react-router-dom";
import './BoardTile.css';
import Button from './BootStrap/Button'
import Modal from './BootStrap/TileModal'


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
		let style = this.props.dem ? {height: this.props.dem, width: this.props.dem} : {}
  	return (
			<span className='tile-wrapper'>
				{ this.props.info.image &&
					<img 
						className='bg-img' 
						style={{'opacity': this.props.info.image && this.props.info.image.opacity + '%', 'maxWidth': this.props.dem, 'maxHeight': this.props.dem}} 
						src={this.props.info.image && this.props.info.image.url} 
				/>
				}
				<div 
					onClick={this.openModal} 
					style={{
						// 'opacity': this.props.info.image && this.props.info.image.opacity + '%', 
						// 'backgroundSize':'contain', 
						// 'backgroundRepeat': 'no-repeat', 
						// 'backgroundImage': `url("${this.props.info.image && this.props.info.image.url}")`,
						...style
					}} 
					className={`box-flex box-border ${this.props.br ? 'br' : ""} ${this.props.bb ? 'bb' : ""}`}
				>
					{!this.props.bare &&  
						<>
						<div className='margin-5 title'>
							{this.props.info.title}
						</div>
						</>
					}	
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
				</div>
			</span>
    )
  }
}

export default BoardTile