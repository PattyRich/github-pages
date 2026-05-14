import React from 'react';
import Button from '../components/BootStrap/Button'
import { useNavigate } from "react-router-dom";
import './ToaFlip.css';


//1 less than actual size for 0 index
let boardSize = 2
let box = { border: '3px black solid', width: '125px', height: '125px', margin: '20px', justifyContent: 'center', alignItems: 'center', display: 'flex', userSelect: 'none', touchAction: 'manipulation' }
let startBoard = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0]
]

class ToaFlip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      board: JSON.parse(JSON.stringify(startBoard)),
      hintTile: [[-1, -1]],
      isFlipping: false,
    }
    this.flipTile = this.flipTile.bind(this)
    this.resetBoard = this.resetBoard.bind(this)
    this.shuffle = this.shuffle.bind(this)
    this.hint = this.hint.bind(this)
  }

  componentDidMount() {
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

  flipTile(i1, i2) {
    if (this.state.isFlipping) return;

    this.setState(prevState => {
      if (prevState.isFlipping) return null;
      let board = flip(i1, i2, prevState.board)
      return { board: board, hintTile: [[-1, -1]], isFlipping: true }
    }, () => {
      this.setState({ isFlipping: false })
    })
  }

  resetBoard() {
    this.setState({ board: JSON.parse(JSON.stringify(startBoard)), hintTile: [[-1, -1]], isFlipping: false })
  }

  shuffle() {
    this.setState(prevState => {
      let board = prevState.board.map((row, i1) => {
        return row.map((tile, i2) => {
          return i1 === 1 && i2 === 1 ? 1 : Math.floor(Math.random() * 2);
        });
      });
      return { board: board, hintTile: [[-1, -1]], isFlipping: false };
    });
  }

  hint() {
    let nextMove = solve(this.state.board)
    this.setState({ hintTile: nextMove })
  }

  render() {
    return (
      <div className="route-dark-bg">
        <Button style={{ position: 'absolute', right: '10px', top: '10px' }} click={() => this.props.navigate('/')} text="Home" variant="primary" />
        <div style={{ 'display': 'flex', 'flexDirection': 'column', 'justifyContent': 'center', 'alignItems': 'center', 'marginTop': '12%' }}>
          {this.state.board.map((row, index1) => {
            return (
              <div key={index1} style={{ 'display': 'flex' }}>
                {row.map((tile, index2) => {
                  return (
                    <div
                      key={index2}
                      className={tile ? 'toa-tile-on' : 'toa-tile-off'}
                      style={{
                        ...box,
                        visibility: index1 === 1 && index2 === 1 ? 'hidden' : 'visible',
                        cursor: this.state.isFlipping ? 'wait' : 'pointer',
                      }}
                      onClick={() => this.flipTile(index1, index2)}
                    >
                      {(this.state.hintTile[0][0] === index1 && this.state.hintTile[0][1] === index2) &&
                        <div
                          className="toa-hint"
                          style={{
                            ...box,
                            width: '40px',
                            height: '40px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            this.flipTile(index1, index2);
                          }}
                        />
                      }
                    </div>
                  )
                })
                }
              </div>
            )
          })
          }
          <button style={{ margin: '5px' }} onClick={this.resetBoard}> Reset (r) </button>
          <button style={{ margin: '5px' }} onClick={this.shuffle}> Shuffle (s) </button>
          <button style={{ margin: '5px' }} onClick={this.hint}> Hint (h) </button>
          {this.state.hintTile[0][0] !== -1 && this.state.hintTile[0][1] !== -1 &&
            <span> Puzzle can be solved in {this.state.hintTile.length} moves </span>
          }
        </div>
      </div>
    )
  }
}

function flip(i1, i2, board) {
  board = JSON.parse(JSON.stringify(board))
  let flipCombos = [[i1 - 1, i2], [i1 + 1, i2], [i1, i2 + 1], [i1, i2 - 1], [i1, i2]]
  flipCombos.forEach((combo) => {
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
  while (true) {
    cnt += 1
    if (cnt >= 10) {
      return;
    }
    let newPaths = []
    paths.forEach((obj) => {
      obj.board.forEach((row, i1) => {
        obj.board.forEach((tile, i2) => {
          if (i1 === 1 && i2 === 1) {
            return
          }
          let flipBoard = flip(i1, i2, obj.board)
          for (let i = 0; i < newPaths.length; i++) {
            if (JSON.stringify(newPaths[i].board) === JSON.stringify(flipBoard)) {
              return
            }
          }
          newPaths.push({
            board: flipBoard,
            prevMoves: [...obj.prevMoves, [i1, i2]]
          })
        })
      })
    })
    newPaths.forEach((obj) => {
      if (checkWin(obj.board)) {
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
    if (!row.every(x => x)) {
      win = false
    }
  })
  return win
}


function withHooks(Component) {
  return props => <Component {...props} navigate={useNavigate()} />;
}

export default withHooks(ToaFlip)
