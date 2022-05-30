import React from 'react';
//import { Link } from "react-router-dom";
import './BoardView.css';
import BoardTile from './BoardTile'
import EditableInput from './BootStrap/EditableInput'
import Button from './BootStrap/Button'
import Alert from 'react-bootstrap/Alert'
import { fetchPost, fetchGet, fetchPut, pwUrlBuilder }  from '../utils/utils.js'
import { useLocation, useNavigate } from "react-router-dom";

class BoardView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      privilage : 'general',
      editMode : false,
      isLoading : false,
      alert : '',
      teams: 5
    }

    const {state} = this.props.location
    this.state = {
      ...this.state,
      ...state
    }

    //if we are coming from creation we have to set some inital stuff up since, we can't just fetch the json object
    if (this.props.prevState) {
      this.state = {...this.state, ...this.props.prevState}
      //we can inherit the old alerts state we don't want
      this.state.alert = ''
      let boardData = []
      for (let i=0; i<this.state.columns; i++) {
        boardData.push([])
        for (let j=0; j<this.state.rows; j++) {
          boardData[i].push({
            points: 0,
            title: '',
            description: '',
            //checked: false,
            image: null
          })
        }     
      }
      this.state.boardData = boardData;      
      this.rows = boardData[0].length
      this.columns = boardData.length
    }

    this.alertTimeout = null;
    this.inputState = this.inputState.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.changeBoardTileInfo = this.changeBoardTileInfo.bind(this)
    this.createBoard = this.createBoard.bind(this)
    this.updateBoard = this.updateBoard.bind(this)
    this.alert = this.alert.bind(this)
    this.switchPrivilage = this.switchPrivilage.bind(this)
    window.addEventListener('resize', this.handleResize)
  }

  async componentDidMount() {
    console.log('did mount')
    if(!this.state.adminPassword && !this.state.generalPassword) {
      this.alert('danger', 'No Password is set, return to main page and start again.', true)
    }
    let url = pwUrlBuilder(this.state)
    if (!this.state.boardData) {
      let [data, err] = await fetchGet(`getBoard/${url}`)
      if (err) {
        this.alert('danger', err.message)
        return
      }
      this.setState({boardData: data.boardData, teams: data.teamData.length})
      this.rows = data.boardData[0].length
      this.columns = data.boardData.length
      console.log(data)
    }
    if (this.state.boardJustCreated) {
      this.alert('success', 'Board Sucessfully Created!')
      this.setState({boardJustCreated: null })
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

  handleResize() {  
    this.forceUpdate()  
  }

  inputState(e, target) {
		let stateChange = {}
    console.log(e.target.value)
    if (target === 'teams' && e.target.value !=='') {
      this.alert('warning', 'If you lower team size you could delete a team with data. Be CAREFUL')
      if (isNaN(e.target.value)) {
        e.target.value = 1
      }
      if (e.target.value <= 0) {
        e.target.value = 1
      } 
      if (e.target.value > 10) {
        e.target.value = 10
      }
      e.target.value = Number(e.target.value)
    }
		stateChange[target] = e.target.value
		this.setState(stateChange)
	}

  async changeBoardTileInfo(row, col, data) {
    await this.updateBoard(row,col,data) 
    console.log('did we wait')
    let x = this.state.boardData;
    x[row][col] = data
    this.setState({boardData: x})
  }

  async createBoard() {
    this.alert('loading')
    const [data, err] = await fetchPost('createBoard', this.state)
    if (data) {
      this.props.navigate('/bingo/' + this.state.boardName, { state: 
        { 
          adminPassword: this.state.adminPassword,
          generalPassword: this.state.generalPassword,
          teams: this.state.teams,
          boardName: this.state.boardName,
          privilage: 'admin',
          boardJustCreated: true
        }
      });
    }
    if (err) {
      this.alert('danger', err.message)
      this.setState({isLoading: false})
      return
    }
  }

  switchPrivilage() {
    if (this.state.privilage === 'admin') {
      this.setState({privilage: 'general', canSwitchPriv: true})
    } else {
      this.setState({privilage: 'admin'})
    }
  }

  async updateBoard(row,col,info) {
    this.alert('loading')
    let url = pwUrlBuilder(this.state)
    let [data, err] = await fetchPut(`updateBoard/${url}`, {row, col, info})
    if (err) {
      this.alert('danger', err.message)
      this.setState({isLoading: false})
      return
    }
    this.setState({isLoading: false})
    this.alert("success", 'Board Successfully Updated!')
  }

  render() {
    let height = document.documentElement.clientHeight
    let width = document.documentElement.clientWidth
    let dem = width < height ? (width / this.rows)-30 : (height / this.columns)-30;
    console.log(this.state, this.props)
    return (
      <div className='flex-wrapper-create'>
        <div className='top-bar'>
          <EditableInput title='Board Name' stateKey='boardName' change={this.inputState} value={this.state.boardName} disabled={!this.state.cameFromCreation} />
          <EditableInput value={this.state.teams} width={200} stateKey='teams' change={this.inputState} title='# of teams' disabled={!(this.state.privilage === 'admin') || !this.state.editMode} />
          { this.state.cameFromCreation && 
            <Button disabled={this.state.isLoading} click={this.createBoard} text="Create Board" variant="success"/>
          } 
          {!this.state.cameFromCreation && 
            <>
            {(this.state.privilage === 'admin' || this.state.canSwitchPriv) &&
              <>
                { this.state.privilage === 'admin' ? 
                  <Button click={this.switchPrivilage} text="Admin Mode" variant="warning"/>
                  :
                  <Button click={this.switchPrivilage} text="General Mode" variant="primary"/>
                }   
              </>    
            }
            { this.state.editMode ? 
              <Button click={() => this.setState({editMode: false})} text="Stop Editing" variant="danger"/>
              :
              <Button click={() => this.setState({editMode: true})} text="Edit Board? ✎" variant="warning"/>
            }
            </>
          }
        </div>
        { this.state.alert && 
          <Alert variant={this.state.alertVariant}>
            {this.state.alert}
          </Alert>   
        }     
        {this.state.boardData &&
          <div className='center-board'>
            {this.state.boardData.map((row,i) => (
              <span key={i} className='flex'>
                  {row.map((tile,j) => (
                    <BoardTile 
                      cord={[i,j]}
                      change={this.changeBoardTileInfo} 
                      info={this.state.boardData[i][j]} 
                      key={j} 
                      dem={dem} 
                      br={this.state.boardData[0].length === j+1} 
                      bb={this.state.boardData.length === i+1} 
                      editMode={this.state.editMode}
                      privilage={this.state.privilage} 
                    />
                  )
                )}
              </span>
              )
            )}
          </div>
        }
      </div>
    )
  }
}

function withHooks(Component) {
  return props => <Component {...props} navigate={useNavigate()} location={useLocation()} />;
}

export default withHooks(BoardView)