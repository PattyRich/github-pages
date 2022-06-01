import React from 'react';
//import { Link } from "react-router-dom";
import './BoardView.css';
import BoardTile from './BoardTile'
import EditableInput from './BootStrap/EditableInput'
import Button from './BootStrap/Button'
import Alert from 'react-bootstrap/Alert'
import { fetchPost, fetchGet, fetchPut, pwUrlBuilder }  from '../utils/utils.js'
import { useLocation, useNavigate } from "react-router-dom";
import Teams from './Teams'
import Toast from './BootStrap/Toast'
import EditTeams from './BootStrap/EditTeams'

class BoardView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      privilage : 'general',
      isLoading : false,
      alert : '',
      teams: 5,
      showEditTeams: false
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
            image: null,
            rowBingo: 0,
            colBingo: 0
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
    this.changeTeam = this.changeTeam.bind(this)
    this.toggleTeamEdit = this.toggleTeamEdit.bind(this)
    this.updateTeams = this.updateTeams.bind(this)
    this.calculateTeamPoints = this.calculateTeamPoints.bind(this)
    this.refreshData = this.refreshData.bind(this)
    window.addEventListener('resize', this.handleResize)
  }

  componentDidMount() {
    const tileHint = localStorage.getItem('tile-hint');
    if (!tileHint) {
      localStorage.setItem('tile-hint', true);
      this.setState({showToast: true})
    }
    if (!this.state.cameFromCreation){
      this.refreshData(true)
    }
    if (this.state.boardJustCreated) {
      this.alert('success', 'Board Successfully Created!')
      this.setState({boardJustCreated: null })
    }
  }

  async refreshData(firstLoad = false) {
    if(!this.state.adminPassword && !this.state.generalPassword) {
      this.alert('danger', 'No Password is set, return to main page and start again.', true)
    }
    let url = pwUrlBuilder(this.state)
    let [data, err] = await fetchGet(`getBoard/${url}`)
    if (err) {
      this.alert('danger', err.message)
      return
    }
    this.setState({
      boardData: data.boardData, 
      teams: data.teamData.length, 
      teamData: data.teamData
    }, () => {
      this.calculateTeamPoints()
      if (firstLoad) {
        this.changeTeam(data.teamData[0].team)
        if (this.state.privilage === 'admin') {
          this.switchPrivilage()
        }
      } else {
        this.changeTeam(this.state.activeTeamData.team)
      }
    })

    this.rows = data.boardData[0].length
    this.columns = data.boardData.length
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

  calculateTeamPoints() {
    if (!this.state.teamData)
      return 
    let x = this.state.teamData
    x.forEach((team)=> {
      let pointTotal = 0
      team.data.teamData.forEach((row,i)=> {
        let addBonusRow = true
        let addBonusCol = true
        row.forEach((tile,j)=> {
          if (addBonusRow && !tile.checked) {
            addBonusRow = false
          }
          if (addBonusCol && !team.data.teamData[j][i].checked){
            addBonusCol = false
          }
          pointTotal += Number(tile.currPoints)
          if (i === this.cols-1 || j === this.rows-1)
            if (addBonusRow) {
              pointTotal += Number(this.state.boardData[i][j].rowBingo)
            }
            if (addBonusCol) {
              pointTotal += Number(this.state.boardData[j][i].colBingo)
            }
        })
      })
      team.pointTotal = pointTotal
    })
    this.setState({teamData: x})
  }

  toggleTeamEdit() {
    this.setState({showEditTeams: !this.state.showEditTeams})
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
    if (this.state.privilage === 'admin') {
      if (!this.state.cameFromCreation) {
        await this.updateBoard(row,col, data) 
      }
    } else {
      data.teamId = this.state.activeTeamData.team
      await this.updateBoard(row,col, data) 
    }
    this.refreshData()
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

  async updateTeams(info) {
    this.alert('loading')
    let url = pwUrlBuilder(this.state)
    let [data, err] = await fetchPut(`updateTeams/${url}`, {info})
    if (err) {
      this.alert('danger', err.message)
      this.setState({isLoading: false})
      return
    }
    this.setState({isLoading: false})
    this.refreshData()
    this.alert("success", 'Teams Successfully Updated!') 
  }

  changeTeam(teamId) {
    let activeTeamData = this.state.teamData.find((team)=> {
      return team.team === teamId
    })
    console.log(activeTeamData)
    this.setState({activeTeamData: activeTeamData})
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
    let dem = width < height ? (width / this.rows)-40 : (height / this.columns)-40;
    console.log(this.state, this.props)
    return (
      <div className='flex-wrapper-create'>
        <div className='top-bar'>
          <EditableInput title='Board Name' width={350} stateKey='boardName' change={this.inputState} value={this.state.boardName} disabled={!this.state.cameFromCreation} />
          { this.state.cameFromCreation && 
            <Button disabled={this.state.isLoading} click={this.createBoard} text="Create Board" variant="success"/>
          } 
          {!this.state.cameFromCreation && 
            <div className='flex bingo-edit'>
            {(this.state.privilage === 'admin' || this.state.canSwitchPriv) &&
              <>
                { this.state.privilage === 'admin' &&
                  <Button click={this.toggleTeamEdit} text="Edit Teams" variant="primary"/>
                }
                { this.state.privilage === 'admin' ? 
                  <Button click={this.switchPrivilage} text="Admin Mode" variant="warning"/>
                  :
                  <Button click={this.switchPrivilage} text="General Mode" variant="primary"/>
                }   
              </>    
            }
            </div>
          }
        </div>
        { this.state.alert && 
          <Alert variant={this.state.alertVariant}>
            {this.state.alert}
          </Alert>   
        }     
        {(this.state.activeTeamData && !(this.state.privilage === 'admin')) && 
          <div style={{'alignItems': 'center'}} className='flex-center'>
            <h3 className='flex-center'> {this.state.activeTeamData.data.name}</h3>
            <span style={{'marginBottom': '0.5rem', 'marginLeft': '10px'}}> (Points : {this.state.activeTeamData.pointTotal}) </span>
          </div>
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
                      teamInfo={(this.state.activeTeamData && this.state.privilage !== 'admin') ? this.state.activeTeamData.data.teamData[i][j] : null}
                      key={j} 
                      dem={dem} 
                      br={this.state.boardData[0].length === j+1} 
                      bb={this.state.boardData.length === i+1} 
                      privilage={this.state.privilage} 
                    />
                  )
                )}
              </span>
              )
            )}
          </div>
        }
        { (this.state.teamData && this.state.activeTeamData && this.state.privilage === 'general') && 
          <Teams 
            changeTeam={this.changeTeam} 
            teams={this.state.teamData}
            activeTeam={this.state.activeTeamData}
          />
        }
        { this.state.showEditTeams &&
          <EditTeams
            show={true}
            handleClose={this.toggleTeamEdit}
            teams={this.state.teamData}
            handleSave={this.updateTeams}
          />
        }
        {	this.state.showToast && 
					<Toast 
          onClose={()=> this.setState({showToast: false})} 
          title="How to Use" position="middle-center" 
          variant='info' 
          message={'Click on the bingo tiles to edit them!'} />
				}
      </div>
    )
  }
}

function withHooks(Component) {
  return props => <Component {...props} navigate={useNavigate()} location={useLocation()} />;
}

export default withHooks(BoardView)