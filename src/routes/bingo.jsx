import React from 'react';
//import { Link } from "react-router-dom";
import './bingo.css';
import BoardTile from '../components/BoardTile'
import "bootstrap/dist/css/bootstrap.css";
import EditableInput from '../components/BootStrap/EditableInput'
import Button from '../components/BootStrap/Button'
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Alert from 'react-bootstrap/Alert'
import Toast from '../components/BootStrap/Toast'
import {fetchGet, fetchPost} from '../utils/utils'
import { useNavigate } from "react-router-dom";
import RecentBoards from '../components/RecentBoards'


class Bingo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
			screen: 1,
			rows: 5,
			columns: 5,
			adminPassword: '',
			generalPassword: '',
			boardName: '',
			privilage: 'admin',
			joinPwTitle: 'general',
			joinPw: '',
			teams: 5
    }

		if (this.props.screenSkip) {
			this.state.screen = this.props.screenSkip
		}

		this.inputState = this.inputState.bind(this);
		this.changeNum = this.changeNum.bind(this);
		this.continue = this.continue.bind(this);
		this.alert = this.alert.bind(this);
		this.auth = this.auth.bind(this);
		this.removeRecent = this.removeRecent.bind(this)
  }

	componentDidMount() {
		if (localStorage.getItem('recentBoards') !== undefined && localStorage.getItem('recentBoards')!== null) {
			let recentBoards = JSON.parse(localStorage.getItem('recentBoards'))
			console.log(recentBoards)
			this.setState({recentBoards: recentBoards})
		}
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

	removeRecent(name){
		let index = this.state.recentBoards.findIndex((thing)=> {
			return thing.boardName === name
		})
		let x = this.state.recentBoards
		x.splice(index, 1)
		this.setState({recentBoards: x})
		localStorage.setItem('recentBoards', JSON.stringify(x))
	}
	async continue() {
		if (!this.state.generalPassword || !this.state.adminPassword || !this.state.boardName) {
			this.alert('danger', 'Please fill out all fields.')
			return;
		}
		if (['join', 'create'].includes(this.state.boardName.toLowerCase())) {
			this.alert('danger', 'Name can\'t be join or create for routing purposes. This probably a rare message to ever see. Congrats')
			return;		
		}
		let boardData = []
		for (let i=0; i<this.state.columns; i++) {
			boardData.push([])
			for (let j=0; j<this.state.rows; j++) {
				boardData[i].push({
					points: 0,
					title: '',
					description: '',
					image: null,
					rowBingo: 0,
					colBingo: 0
				})
			}   
		}  

		this.alert('loading')
		const [data, err] = await fetchPost('createBoard', {...this.state, boardData})
		if (data) {
			this.props.navigate('/bingo/' + this.state.boardName, { state: 
				{ 
					adminPassword: this.state.adminPassword,
					generalPassword: this.state.generalPassword,
					teams: this.state.teams,
					boardName: this.state.boardName,
					privilage: 'admin',
				}
			});
		}
		if (err) {
			this.alert('danger', err.message)
			this.setState({isLoading: false})
			return
		}
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

	async auth(recentSkip = false) {		
		if(recentSkip && recentSkip.boardName) {
			console.log(recentSkip)
			let obj = {}
			obj.generalPassword = recentSkip.password
			obj.adminPassword = recentSkip.password
			obj.privilage = recentSkip.priv
			obj.boardName = recentSkip.boardName
			this.props.navigate('/bingo/' + obj.boardName, { state: obj });
			return
		}

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

		if (!this.state.recentBoards) {
			let obj = [{
				'boardName': this.state.boardName, 
				'password': this.state.joinPw,
				'priv': this.state.joinPwTitle
			}]
			localStorage.setItem('recentBoards', JSON.stringify(obj))
		} else {
			let find = this.state.recentBoards.find((item)=> {
				return (item.boardName === this.state.boardName && this.state.joinPwTitle === item.priv)
			})
			if (!find) {
				let x = this.state.recentBoards
				let obj = {
					'boardName': this.state.boardName, 
					'password': this.state.joinPw,
					'priv': this.state.joinPwTitle
				}
				x.push(obj)
				localStorage.setItem('recentBoards', JSON.stringify(x))
			}
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
						<div className='start-menu' onClick={() => this.props.navigate('/bingo/create')}> 
							<h1>
								Create Bingo Board
							</h1>
						</div>
						<div className='start-menu' onClick={() => this.props.navigate('/bingo/join')}>
							<h1>
								Join Bingo Board
							</h1>
						</div>
					</div>
				}
				{this.state.screen === 2 && 
					<div className='create-menu'>
						<div style={{'margin': '5px'}}>
							***NOTE do NOT use "REAL" passwords. I DON'T ENCRYPT this data, make it fun passwords that don't mean anything
							<br/>
							boards auto delete after 2 MONTHS do NOT reuse boards
						</div>
						<EditableInput title='Board Name' stateKey='boardName' change={this.inputState} value={this.state.boardName} />
						<div style={{'margin': '5px'}}>
						Admins have the ability to edit board specifics like point values, images, descriptions, team count / names.
						</div>
						<EditableInput title='Admin Password' stateKey='adminPassword' change={this.inputState} value={this.state.adminPassword} />
						<div style={{'margin': '5px'}}>
						General users will only be able to change team data.
						</div>
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
						<Button variant="success" click={this.continue} text="Create Board"></Button>
					</div>
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
								onKeyUp={(e)=> {
									let code = e.keyCode || e .which
									//if enter was pressed
									if (code === 13) {
										this.auth()
									}
								}}
							/>
						</InputGroup>		
						<Button variant="success" click={this.auth} text="Join"></Button>
						{ this.state.recentBoards && this.state.recentBoards.length > 0 &&
							<RecentBoards click={this.auth} removeRecent={this.removeRecent} recent={this.state.recentBoards} />
						}
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