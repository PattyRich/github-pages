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
import SettingsModal from './BootStrap/SettingsModal';
import FeedbackModal from './BootStrap/FeedbackModal';

class BoardView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      privilage : 'general',
      isLoading : false,
      alert : '',
      teams: 5,
      showEditTeams: false,
      generalPasswordCopy: ''
    }

    const {state} = this.props.location
    this.state = {
      ...this.state,
      ...state
    }

    this.alertTimeout = null;
    this.inputState = this.inputState.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.changeBoardTileInfo = this.changeBoardTileInfo.bind(this)
    this.updateBoard = this.updateBoard.bind(this)
    this.alert = this.alert.bind(this)
    this.switchPrivilage = this.switchPrivilage.bind(this)
    this.changeTeam = this.changeTeam.bind(this)
    this.toggleTeamEdit = this.toggleTeamEdit.bind(this)
    this.updateTeams = this.updateTeams.bind(this)
    this.calculateTeamPoints = this.calculateTeamPoints.bind(this)
    this.refreshData = this.refreshData.bind(this)
    this.clearAlert = this.clearAlert.bind(this)
    this.clipboard = this.clipboard.bind(this)
    window.addEventListener('resize', this.handleResize)
    
    //poll every 1 min for data
    this.refreshInterval = setInterval(()=> {
      this.refreshData()
    }, 60000)
  }


  promisedSetState = (newState) => new Promise(resolve => this.setState(newState, resolve));

  async componentDidMount() {
    const params = new URLSearchParams(this.props.location.search);
    const pw = params.get('password');
    if (pw) {
      const path = window.location.href.replace(/^https?:\/\//, '').split('/');
      await this.promisedSetState({privilage: 'general', generalPassword: pw, boardName: decodeURI(path[path.length-1].split('?')[0])})
    }

    const tileHint = localStorage.getItem('tile-hint');
    if (!tileHint) {
      localStorage.setItem('tile-hint', true);
      this.setState({showToast: true})
    }
    this.refreshData(!this.state.cameFromCreate, true )
    if (this.state.boardJustCreated) {
      this.alert('success', 'Board Successfully Created!')
      this.setState({boardJustCreated: null })
    }
  }

  componentWillUnmount(){
    if (this.refreshInterval)
      clearInterval(this.refreshInterval)
    }

  async refreshData(firstLoad = false, changeTeam=false) {
    if(!this.state.adminPassword && !this.state.generalPassword) {
      this.alert('danger', 'No Password is set, return to main page and start again.', true)
      return;
    }
    let url = pwUrlBuilder(this.state)
    let [data, err] = await fetchGet(`getBoard/${url}`)
    if (err) {
      this.alert('danger', err.message)
      return
    }
    let activeTeamValue = 0;
    if (changeTeam){
      let activeTeam = localStorage.getItem('activeTeam')
      if (activeTeam) {
        activeTeam = Number(activeTeam)
        if (activeTeam <= data.teamData.length -1 && activeTeam >= 0) {
          activeTeamValue = activeTeam
        }
      }
    }
    
    this.setState({
      boardData: data.boardData, 
      teams: data.teamData.length, 
      teamData: data.teamData,
      activeTeamIndex: this.state.activeTeamIndex || activeTeamValue,
      generalPasswordCopy: data.generalPassword
    }, () => {
      this.calculateTeamPoints()
      if (firstLoad) {
        if (this.state.privilage === 'admin') {
          this.switchPrivilage()
        }
      }
    })

    this.rows = data.boardData[0].length
    this.columns = data.boardData.length
  }

  clearAlert() {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout)
    }
    this.setState({alert: ''})
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
    let x = JSON.parse(JSON.stringify(this.state.teamData))
    x.forEach((team)=> {
      let pointTotal = 0
      team.data.teamData.forEach((row,i)=> {
        let addBonusRow = true
        row.forEach((tile,j)=> {
          if (addBonusRow && !tile.checked) {
            addBonusRow = false
          }
          pointTotal += Number(tile.currPoints)
          if (j === this.rows-1)
            if (addBonusRow) {
              pointTotal += Number(this.state.boardData[i][j].rowBingo)
            }
        })
      })
      team.pointTotal = pointTotal
    })
    x.forEach((team)=> {
      let pointTotal = 0
      transpose(team.data.teamData).forEach((row,i)=> {
        let addBonusRow = true
        row.forEach((tile,j)=> {
          if (addBonusRow && !tile.checked) {
            addBonusRow = false
          }
          if (j === this.columns-1)
            if (addBonusRow) {
              pointTotal += Number(this.state.boardData[j][i].colBingo)
            }
        })
      })
      team.pointTotal += pointTotal
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
    data.teamId = this.state.teamData[this.state.activeTeamIndex].team
    await this.updateBoard(row,col, data)  
    this.refreshData()
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
    this.setState({activeTeamIndex: teamId})
  }

  switchPrivilage() {
    if (this.state.privilage === 'admin') {
      this.setState({privilage: 'general', canSwitchPriv: true})
    } else {
      this.setState({privilage: 'admin'})
    }
  }

  clipboard() {
    navigator.clipboard.writeText(`${window.location.href}?password=${encodeURIComponent(this.state.generalPasswordCopy)}`).then(function() {
    }, function(err) {
    });
    this.setState({showToast2: true})
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
    const showFeedback = localStorage.getItem('showFeedback') === 'true'
    let height = document.documentElement.clientHeight
    let width = document.documentElement.clientWidth
    let maxWidth = (width / this.rows) - ((width < 600 || height < 600) ? 8 : 40)
    let maxHeight = (height / this.columns) - ((width < 600 || height < 600) ? 8 : 40)
    let dem = maxHeight < maxWidth ? maxHeight : maxWidth
    //let dem = width < height ? (width / this.rows)-40 : (height / this.columns)-40;
    return (
      <div className='flex-wrapper-create'>
        <div className='top-bar'>
          <h2 style={{'marginTop': '0px'}}> {this.state.boardName} </h2>
          <div className='flex bingo-edit'>
          <Button click={()=> this.props.navigate('/')} text="Go Home" variant="primary"/>
          <Button click={()=> this.setState({showSettings: true})} text="Settings" variant="primary"/>
          {(this.state.privilage === 'admin' || this.state.canSwitchPriv) &&
            <>
              { this.state.privilage === 'admin' &&
                <>
                  <Button click={this.toggleTeamEdit} text="Edit Teams" variant="primary"/>
                  <Button style={{'marginRight': '10px'}} click={this.clipboard} variant='warning' text={'Auto Signin Link 📋'} />
                </>
              }
              { this.state.privilage === 'admin' ? 
                <Button click={this.switchPrivilage} text="Admin Mode" variant="warning"/>
                :
                <Button click={this.switchPrivilage} text="General Mode" variant="primary"/>
              }     
            </>    
          }
          </div>
        </div>
        { this.state.alert && 
          <Alert onClick={this.clearAlert} style={{'position' : 'absolute', 'width': '100%'}} className='' variant={this.state.alertVariant}>
            {this.state.alert}
          </Alert>   
        }     
        {(this.state.teamData && !(this.state.privilage === 'admin')) && 
          <div style={{'alignItems': 'center'}} className='flex-center'>
            <h3 className='flex-center'> {this.state.teamData[this.state.activeTeamIndex].data.name}</h3>
            <span style={{'marginBottom': '0.5rem', 'marginLeft': '10px'}}> (Points : {this.state.teamData[this.state.activeTeamIndex].pointTotal}) </span>
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
                      teamInfo={(this.state.teamData && this.state.privilage !== 'admin') ? this.state.teamData[this.state.activeTeamIndex].data.teamData[i][j] : null}
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
        { (this.state.teamData && this.state.privilage === 'general') && 
          <Teams 
            changeTeam={this.changeTeam} 
            teams={this.state.teamData}
            activeTeam={this.state.teamData[this.state.activeTeamIndex]}
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
        {	this.state.showToast2 && 
          <Toast
            onClose={() => this.setState({showToast2: false})}
            message={'Copied to Clipboard. If you want to sign in as the admin again you\'ll need to auth from the main page.'}
            variant={'success'}
            position={'top-end'}
            title={'Success'}
            timeout={5000}
          />
				}
        {	this.state.showSettings && 
          <SettingsModal handleClose={()=> this.setState({showSettings: false})} />
				}
        { !showFeedback && width > 1000 ? 
          <div className='feedback' onClick={()=>this.setState({showFeedback: true})}>
            feedback
          </div> : ''
        }
        {	this.state.showFeedback && 
          <FeedbackModal handleClose={()=> this.setState({showFeedback: false})} />
				}
      </div>
    )
  }
}

function withHooks(Component) {
  return props => <Component {...props} navigate={useNavigate()} location={useLocation()} />;
}

export default withHooks(BoardView)

function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map(row => row[i]));
} 