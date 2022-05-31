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
			<div onClick={this.openModal} style={style} className={`box-flex box-border ${this.props.br ? 'br' : ""} ${this.props.bb ? 'bb' : ""}`}>
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
					/>
				}
			</div>
    )
  }
}

export default BoardTile