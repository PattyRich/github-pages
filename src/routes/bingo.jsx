import React from 'react';
//import { Link } from "react-router-dom";
import './bingo.css';
import BoardTile from '../components/BoardTile'
import BoardView from '../components/BoardView'
import "bootstrap/dist/css/bootstrap.css";
import EditableInput from '../components/BootStrap/EditableInput'
import Button from '../components/BootStrap/Button'
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Alert from 'react-bootstrap/Alert'
import Toast from '../components/BootStrap/Toast'
import {fetchGet} from '../utils/utils'
import { useNavigate } from "react-router-dom";


class Bingo extends React.Component {
  constructor() {
    super();
    this.state = {
			screen: 1,
			rows: 5,
			columns: 5,
			adminPassword: '',
			generalPassword: '',
			boardName: '',
			cameFromCreation: true,
			privilage: 'admin',
			joinPwTitle: 'general',
			joinPw: ''
    }
		this.inputState = this.inputState.bind(this);
		this.changeNum = this.changeNum.bind(this);
		this.continue = this.continue.bind(this);
		this.alert = this.alert.bind(this);
		this.auth = this.auth.bind(this);
  }

	inputState(e, target) {
		let stateChange = {}
		stateChange[target] = e.target.value
		this.setState(stateChange)
	}

	changeNum(value, target) {
		let currValue = this.state[target]
		currValue += value
		let stateChange = {}
		if(currValue < 1) {
			currValue = 1
		}
		if (currValue > 10) {
			currValue = 10
		}
		stateChange[target] = currValue

 		this.setState(stateChange)
	}

	continue() {
		if (!this.state.generalPassword || !this.state.adminPassword || !this.state.boardName) {
			this.alert('danger', 'Please fill out all fields.')
			this.setState({showToast: true})
			return;
		}
		this.setState({screen: 3, alert: ''})
	}

	alert(variant, message, skipTimeout=false) {
    if (variant === 'loading') {
      this.setState({alertVariant: 'warning', isLoading: true, alert: 'Loading...'})
    } else {
      this.setState({alertVariant: variant, alert: message}) 
      if (this.alertTimeout) {
        clearTimeout(this.alertTimeout)
      }
      if (skipTimeout) { return; }
      this.alertTimeout = setTimeout(()=> {
        this.setState({alert: ''})
      },5000)
    }
  }

	async auth() {		
    let [data, err] = await fetchGet(`auth/${this.state.boardName}/${this.state.joinPw}/${this.state.joinPwTitle}`)
		if (err) {
			this.alert('danger', err.message)
			return;
		}
		let state = {
			boardName: this.state.boardName,
		}
		if (this.state.joinPwTitle === 'general') {
			state.generalPassword = this.state.joinPw
		} else {
			state.adminPassword = this.state.joinPw
			state.privilage = 'general'
			state.canSwitchPriv = true
		}
		this.props.navigate('/bingo/' + this.state.boardName, { state });
	}

  render() {
		console.log(this.state)
  	return (
			<>
			  { this.state.alert && 
          <Alert style={{'position' : 'absolute', 'width': '100%'}} variant={this.state.alertVariant}>
            {this.state.alert}
          </Alert>   
        } 
				{/* {	this.state.showToast && 
					<Toast variant='danger' message={'uh ohohhh'} />
				} */}
				{this.state.screen === 1 && 
					<div className='start-screen'>
						<div className='start-menu' onClick={() => this.setState({screen: 2})}> 
							<h1>
								Create Bingo Board
							</h1>
						</div>
						<div className='start-menu' onClick={() => this.setState({screen: 4})}>
							<h1>
								Join Bingo Board
							</h1>
						</div>
					</div>
				}
				{this.state.screen === 2 && 
					<div className='create-menu'>
						Board Name 
						<EditableInput title='Board Name' stateKey='boardName' change={this.inputState} value={this.state.boardName} />
						Admin Password
						<EditableInput title='Admin Password' stateKey='adminPassword' change={this.inputState} value={this.state.adminPassword} />
						General Password
						<EditableInput title='General Password' stateKey='generalPassword' change={this.inputState} value={this.state.generalPassword} />
						Board Size. (This cannot be changed later)
						<div className="board-controls"> 
							<Button click={()=> this.changeNum(-1, 'rows')} text="-"></Button>
							Row : {this.state.rows}
							<Button click={()=> this.changeNum(1, 'rows')} text="+"></Button>
							<Button click={()=> this.changeNum(-1, 'columns')} text="-"></Button>
							Column : {this.state.columns}
							<Button click={()=> this.changeNum(1, 'columns')} text="+"></Button>
						</div>
						<div className='margin-15'>
							{[...Array(this.state.columns)].map((x,i) => (
								<span key={i} className='flex'>
										{[...Array(this.state.rows)].map((x,j) => (
											<BoardTile bare={true} key={j} br={this.state.rows === j+1} bb={this.state.columns=== i+1} />
										)
									)}
								</span>
								)
							)}
						</div>
						<Button click={this.continue} text="Continue"></Button>
					</div>
				}
				{this.state.screen === 3 && 
					<BoardView prevState={this.state} />
				}
				{this.state.screen === 4 && 
					<span className='flex join-wrapper'>
						<h1 className='margin-15'> Join a Bingo Board </h1>
						<EditableInput title='Board Name' stateKey='boardName' change={this.inputState} value={this.state.boardName} />
						<InputGroup style={{width: '500px'}} className="mb-3">
							<DropdownButton
								variant="outline-secondary"
								title={this.state.joinPwTitle + ' Password'}
								id="input-group-dropdown-1"
							>
								<Dropdown.Item onClick={()=> this.setState({joinPwTitle: 'general'})} href="#">General</Dropdown.Item>
								<Dropdown.Divider />
								<Dropdown.Item onClick={()=> this.setState({joinPwTitle: 'admin'})} href="#">Admin</Dropdown.Item>
							</DropdownButton>
							<FormControl             
								value={this.state.joinPw}
            		onChange={(e)=>{this.setState({joinPw: e.target.value})}} 
							/>
						</InputGroup>		
						<Button click={this.auth} text="Join"></Button>
					</span>		
				}
			</>
    )
  }
}

function withHooks(Component) {
  return props => <Component {...props} navigate={useNavigate()} />;
}

export default withHooks(Bingo)