import React from 'react';
//import { Link } from "react-router-dom";
import './BingoDraft.css'
import Button from '../components/BootStrap/Button'
import EditableInput from '../components/BootStrap/EditableInput';	
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Dustbin } from '../components/DND/Dustbin';
import { Box } from '../components/DND/Box'
import Toast from '../components/BootStrap/Toast'
import Alert from "react-bootstrap/Alert";

class BingoDraft extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editMode: true,
      teams: [],
      players: '',
      filter: '',
      showToast: false
    }
    if (localStorage.getItem('bingo-draft')){
      this.state = {
        ...JSON.parse(localStorage.getItem('bingo-draft'))
      }
    } else {
      for (let i = 0; i < 4; i++) {
        this.state.teams.push(
          {
            name: 'team-' + i,
            members: []
          }
        )
      }
    }
    this.editName = this.editName.bind(this)
    this.shuffle = this.shuffle.bind(this)
    this.changeTeamCount = this.changeTeamCount.bind(this)
    this.inputState = this.inputState.bind(this)
    this.movePlayer = this.movePlayer.bind(this)
    this.toggleEdit = this.toggleEdit.bind(this)
    this.clipboard = this.clipboard.bind(this)
    this.toggleToast = this.toggleToast.bind(this)    
    this.resetData = this.resetData.bind(this)
  }

  componentDidMount(){
    if (!localStorage.getItem('draft-hint')) {
      this.showHint = true
    }
  }
  
  resetData() {
    let teams = []
    for (let i = 0; i < 4; i++) {
      teams.push(
        {
          name: 'team-' + i,
          members: []
        }
      )
    }
    this.setState({
      editMode: true,
      teams: teams,
      players: '',
      filter: '',
      showToast: false
    })
  }

  clipboard() {
    let message = []
    this.state.teams.map((team)=>{
      let x = ''
      x += `Team ${team.name} has players `
      team.members.map((player)=> {
        x += player + ' '
      })
      message.push(x)
    })
    navigator.clipboard.writeText(message.join('\n')).then(function() {
    }, function(err) {
    });
    this.setState({showToast: true})
  }

  movePlayer(player, team) {
    let players = this.state.players.split(',')
    let teams = this.state.teams
    let index = players.findIndex((person)=> person === player)
    if (index < 0) {
      for (let i=0; i<teams.length; i++){
        let indexx = teams[i].members.findIndex((person)=> person === player)
        if (indexx >= 0) {
          teams[i].members.splice(indexx,1)
          break
        }
      }
    } else {
      players.splice(index,1)
    }
    index = teams.findIndex((teamm)=> teamm.name === team)
    if (index >= 0){
      teams[index].members.push(player)
    } else {
      players.push(player)
    }
    this.setState({players: players.join(','), teams: teams})
    localStorage.setItem('bingo-draft', JSON.stringify(this.state))
  }

  toggleEdit() {
    if (this.state.editMode === true) {
      this.setState({showToastTwo: true})
    }
    this.setState({editMode: !this.state.editMode, players: this.state.players.split(',').map((name)=>name.trim()).join(',')})
  }

  toggleToast(key) {
    if (key === 'showToastTwo') {
      localStorage.setItem('draft-hint', true)
    }
    let stateChange = {}
    stateChange[key] = !this.state[key]
    this.setState(stateChange)
  }

  inputState(e, target) {
		let stateChange = {}
		stateChange[target] = e.target.value
		this.setState(stateChange)
    localStorage.setItem('bingo-draft', JSON.stringify(this.state))
	}

  editName(e,index) {
    let x = this.state.teams
    x[index].name = e.target.value
    this.setState({teams: x})
  }

  shuffle() {
    let x = this.state.teams
    shuffle(x)
    this.setState({teams: x})
  }

  changeTeamCount(addTeam){
    let x = this.state.teams
    if (addTeam) {
      x.push({name: 'team-' + x.length, members: []})
    } else {
      x.pop()
    }
    this.setState({teams: x})
  }

  render() {
    return (
      <DndProvider backend={HTML5Backend}>
      <div className='draft-wrap'>
        <h2 className='draft-title' style={{'paddingTop': '15px'}}>
          Bingo Draft
        </h2>
        <div className='draft-edit-mode'> 
        {this.state.editMode && 
          <>
          <Button style={{'marginRight': '10px'}} click={this.resetData} variant='danger' text={'Reset'} />
          <Button style={{'marginRight': '10px'}} click={this.shuffle} variant='warning' text={'Shuffle Team Order'} />
          </>
        }
        { !this.state.editMode &&
          <Button style={{'marginRight': '10px'}} click={this.clipboard} variant='outline-primary' text={'Copy teams to clipboard 📋'} />
        }
        { this.state.editMode ?
          <Button click={this.toggleEdit} variant='success' text={'Start Draft'} />
          :
          <Button click={this.toggleEdit} variant='warning' text={'Edit Mode ✎'} />
        }
        </div>
        { this.state.editMode &&
          <div className='flex-center' style={{'alignItems': 'center'}}>
              <Button click={()=>this.changeTeamCount(false)} variant='outline-primary' text={'-'} />
                <span style={{'margin': '0px 10px 0px 10px'}}> Add or Remove Teams </span>
              <Button click={()=>this.changeTeamCount(true)} variant='outline-primary' text={'+'} />
          </div>
        }
        <div className='draft-teams'>
          { this.state.teams.map((team, i)=>{
            return(
              <Dustbin dropped={this.movePlayer} editMode={this.state.editMode} key={i+team.name} team={team} />
            )
          })
          }
        </div>
        { this.state.editMode ?
          <div className='flex-center' style={{'flexDirection': 'column', 'alignItems': 'center'}}>
            <Alert varint={'primary'}>
              Add player names with a comma seperating them, then get out of edit mode. Drag and drop players to their team for bingo drafts!
            </Alert>
            <EditableInput stateKey='players' change={this.inputState} width={'75%'} title='Players' textArea={true} value={this.state.players} />
          </div>
          :

          <div className='flex'>
            <span style={{'marginLeft': '15px'}}>
              <EditableInput stateKey='filter' change={this.inputState} width={200} title='Filter' value={this.state.filter} />
            </span>
            <div className='flex' style={{'marginLeft': '15px', 'width': '100%', 'flexWrap': 'wrap'}}>
              {this.state.players.split(',')
              .filter((name)=>name.toLocaleLowerCase()
              .includes(this.state.filter.toLowerCase()))
              .sort((a,b)=> a.toLowerCase().localeCompare(b.toLowerCase()))
              .map((player, i)=> {
                return player && <Box notPlaced={true} dropped={this.movePlayer} key={`${i}-${player}`} name={player} />
              })
              }
            </div>
          </div>
        }
        {this.state.showToast && 
          <Toast
            onClose={() => this.toggleToast('showToast')}
            message={'Copied to Clipboard'}
            variant={'success'}
            position={'top-center'}
            title={'Success'}
            timeout={2000}
          />
        }
        {this.state.showToastTwo && this.showHint &&
          <Toast
            onClose={() => this.toggleToast('showToastTwo')}
            message={'Drag and drop tiles to the team you want.'}
            variant={'success'}
            position={'middle-start'}
            title={'Help'}
            timeout={4000}
          />
        }
      </div>
      </DndProvider>
    )
  }
}

export default BingoDraft

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}
