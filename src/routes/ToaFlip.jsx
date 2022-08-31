import React from 'react';
import Button from '../components/BootStrap/Button'
import { useNavigate } from "react-router-dom";


//1 less than actual size for 0 index
let boardSize = 2
let box = {border: '1px black solid', width: '125px', height: '125px', margin: '20px', justifyContent: 'center', alignItems: 'center', display: 'flex'}
let startBoard = [
  [0,0,0],
  [0,1,0],
  [0,0,0]
]

class ToaFlip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      board: JSON.parse(JSON.stringify(startBoard)),
      hintTile: [[-1,-1]]
    }
    this.flipTile = this.flipTile.bind(this)
    this.resetBoard = this.resetBoard.bind(this)
    this.shuffle = this.shuffle.bind(this)
    this.hint = this.hint.bind(this)
  }

  componentDidMount(){
    this.shuffle()
    document.addEventListener('keyup', event => {
      if (['r', 'R'].includes(event.key)) {
        this.resetBoard()
      }
      if (['s', 'S'].includes(event.key)) {
        this.shuffle()
      }
      if (['h', 'H'].includes(event.key)) {
        this.hint()
      }
    })
  }

  flipTile(i1,i2) {
    let board = this.state.board
    board = flip(i1,i2, board)
    this.setState({board: board, hintTile: [[-1,-1]]})
  }

  resetBoard(){
    this.setState({board: JSON.parse(JSON.stringify(startBoard)), hintTile: [[-1,-1]]})
  }

  shuffle(){
    let board = this.state.board
    board = board.map((row,i1)=>{
      return row.map((tile,i2)=>{
        return i1 === 1 && i2 ===1 ? 1 : Math.floor(Math.random() * 2);
      })
    })
    this.setState({board: board, hintTile: [[-1,-1]]})
  }

  hint(){
    let nextMove = solve(this.state.board)
    this.setState({hintTile: nextMove})
  }

  render() {
  	return (
      <>
      <Button style={{position: 'absolute', right: '10px', top: '10px'}} click={()=> this.props.navigate('/')} text="Home" variant="primary"/>
			<div style={{'display': 'flex', 'flexDirection': 'column' , 'justifyContent': 'center', 'alignItems': 'center', 'marginTop': '12%'}}>
        { this.state.board.map((row, index1)=> {
          return (
            <div style={{'display': 'flex'}}>
            { row.map((tile, index2)=>{
              return (
                <>
                  <div 
                  style={{
                    ...box, 
                    visibility: index1 === 1 && index2 ===1 ? 'hidden': 'visible', 
                    backgroundColor: tile ? 'green': 'inherit',

                  }}
                  onClick={()=>this.flipTile(index1,index2)}
                  >
                  { (this.state.hintTile[0][0] === index1 && this.state.hintTile[0][1] === index2) &&
                    <div 
                      style={{
                        ...box, 
                        width: '40px',
                        height: '40px',   
                        backgroundColor: 'yellow',

                      }}
                      onClick={()=>this.flipTile(index1,index2)
                    }
                    />                 
                  } 
                  </div>
                </>
              )
              })
            }
           </div>
          )
        })
        }
        <button style={{margin: '5px'}} onClick={this.resetBoard}> Reset (r) </button>
        <button style={{margin: '5px'}} onClick={this.shuffle}> Shuffle (s) </button>
        <button style={{margin: '5px'}} onClick={this.hint}> Hint (h) </button>
        {this.state.hintTile[0][0] !== -1 && this.state.hintTile[0][1] !== -1 &&
          <span> Puzzle can be solved in {this.state.hintTile.length} moves </span>
        }
      </div>
      </>
    )
  }
}

function flip(i1,i2, board) {
  board = JSON.parse(JSON.stringify(board))
  let flipCombos = [[i1-1, i2], [i1 +1, i2],[i1, i2+1], [i1, i2-1], [i1,i2]]
    flipCombos.forEach((combo)=> {
      if (combo[0] > boardSize || combo[0] < 0 || combo[1] > boardSize || combo[1] < 0 || (combo[1] === 1 && combo[0] === 1)) {
        return
      }
      board[combo[0]][combo[1]] = board[combo[0]][combo[1]] === 1 ? 0 : 1
    })
    return board
}

function solve(board) {
  board = JSON.parse(JSON.stringify(board))
  let obj = {
    board: board,
    prevMoves: []
  }
  let paths = [obj]

  let breakOut = false
  let cnt = 0
  let newMove = null
  while(true){
    cnt +=1
    if (cnt >=10) {
      return;
    }
    let newPaths = []
    paths.forEach((obj)=> {
      obj.board.forEach((row, i1)=>{
        board.forEach((tile, i2)=>{
          if (i1 ===1 && i2 ===1) {
            return
          }
          let flipBoard = flip(i1,i2, obj.board)
          for(let i=0; i<newPaths.length; i++) {
            if (JSON.stringify(newPaths[i].board) === JSON.stringify(flipBoard)) {
              return
            }
          }
          newPaths.push({
            board: flipBoard,
            prevMoves: [...obj.prevMoves, [i1,i2]]
          })
        })
      })
    })
    newPaths.forEach((obj)=> {
      if (checkWin(obj.board)){
        newMove = obj.prevMoves
        breakOut = true
      }
    })
    if (breakOut) {
      break;
    }
    paths = newPaths
  }
  return newMove
}

function checkWin(board) {
  let win = true;
  board.forEach(row => {
    if (!row.every(x => x)){
      win = false
    }
  })
  return win
}


function withHooks(Component) {
  return props => <Component {...props} navigate={useNavigate()} />;
}

export default withHooks(ToaFlip)
