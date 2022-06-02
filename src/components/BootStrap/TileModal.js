import React, {useEffect} from 'react';
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal"
import EditableInput from './EditableInput';
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

const numInputs = ['points', 'currPoints', 'rowBingo', 'colBingo']

class TileModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      wikiSearch: '',
      ...props.info,
      ...props.teamInfo
    }

    this.listOfImages = []
    console.log(props)
    this.inputState = this.inputState.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.toggleCheck = this.toggleCheck.bind(this)
    this.setImage = this.setImage.bind(this)
    this.getImage = this.getImage.bind(this)
    this.changeOpacity = this.changeOpacity.bind(this)
    this.toggleImageSelect = this.toggleImageSelect.bind(this)
  }

  inputState(e, target) {
		let stateChange = {}
    if (numInputs.includes(target)) {
      if (isNaN(e.target.value)) {
        e.target.value = 0
      }
      if (target==='currPoints') {
        if (Number(e.target.value) > Number(this.state.points)) {
          e.target.value = this.state.points
        }
      }
    }
    if (target==='wikiSearch') {
      e.target.value = nameFilter(e.target.value)
    }
		stateChange[target] = e.target.value
		this.setState(stateChange)
	}

  toggleImageSelect() {
    this.setState({chooseImage: true})
    this.listOfImages = importAll(require.context('/public/assets', false, /\.(png)$/));
  }

  getImage() {
    let image = this.state.wikiSearch
    let url = `https://oldschool.runescape.wiki/images/thumb/${encodeURIComponent(image)}_detail.png/180px-${encodeURIComponent(image)}_detail.png`
    this.setState({wikiSearchImg: url})
  }

  setImage(image, skipUrlBuild = false) {
    let url;
    if (skipUrlBuild) {
      url = image
    } else {
      url = `https://oldschool.runescape.wiki/images/thumb/${encodeURIComponent(image)}_detail.png/180px-${encodeURIComponent(image)}_detail.png`
    }
    let obj = {
      opacity: '100',
      url: url
    }
    this.setState({image: obj, chooseImage: false})
  }

  changeOpacity(e, target) {
    if (isNaN(e.target.value)) {
      e.target.value = 100
    }
    if (e.target.value !== ''){
      if (e.target.value > 100) {
        e.target.value = 100
      } 
      if (e.target.value <= 1) {
        e.target.value = 1
      } 
    }
    let x = this.state.image
    console.log(e.target.value !== '', e.target.value)
    x.opacity = Number(e.target.value)
    console.log(x)
    this.setState({image: x})
  }

  toggleCheck() {
    this.setState({checked: !this.state.checked, currPoints: this.state.points})
  }

  handleSave() {
    let state = {...this.state}
    if (this.props.privilage === 'admin') {
      delete state.checked
      delete state.proof
      delete state.currPoints
    } else {
      state = {
        checked: state.checked,
        proof: state.proof,
        currPoints: state.currPoints
      }
    }
    this.props.change(this.props.cord[0], this.props.cord[1], this.state)
    this.props.handleClose()
  }

  handleClose() {
    this.props.handleClose()
  }

  render() {
    console.log(this.state)
    let disabled = this.props.privilage != 'admin'
    let generalDisabled = !disabled
    return (
      <Modal
        show={this.props.show}
        onHide={this.handleClose}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            { !this.state.chooseImage ?
              <> 
              { !disabled ?
                <EditableInput value={this.state.title} stateKey='title' change={this.inputState} title='Title' disabled={disabled}/>
                :
                <h2>{this.state.title || 'Info'}</h2>
              }
              </>
              :
              <h3>Set Tile Background Image</h3>
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { !this.state.chooseImage ?
            <>
              <EditableInput value={this.state.description} textArea={true} stateKey='description' change={this.inputState} title='Description' disabled={disabled} />
              { this.props.br &&
                <EditableInput value={this.state.rowBingo} stateKey='rowBingo' change={this.inputState} title='Row Bonus' disabled={disabled} />
              }
              { this.props.bb &&
                <EditableInput value={this.state.colBingo} stateKey='colBingo' change={this.inputState} title='Column Bonus' disabled={disabled} />
              }
              { !disabled &&
                <>
                { this.state.image ? 
                  <>
                    <Button style={{'marginBottom': '10px'}}
                      variant="primary"
                      onClick={()=> {this.setState({image: null})}}
                    > Remove Tile Background Image </Button> : 
                    <img 
                      src={this.state.image.url}
                      style={{'maxWidth': '60px', 'opacity': this.state.image.opacity + '%'}}
                    />
                  </>
                  :
                  <Button 
                  style={{'marginBottom': '10px'}} 
                  variant="primary" 
                  onClick={this.toggleImageSelect}
                  > Set Tile Background Image </Button>
                }
                { this.state.image &&
                  <EditableInput value={this.state.image.opacity} change={this.changeOpacity} title='Image Opacity (1-100)' />
                }
                </>
              }
              <InputGroup className="mb-3" style={{'width': '240px'}}>
                <InputGroup.Text id="basic-addon1">Points</InputGroup.Text> 
                <FormControl placeholder={!disabled ? '0' : null} value={this.state.currPoints} disabled={!disabled || this.state.checked} onChange={(e) => this.inputState(e,'currPoints')} />
                <InputGroup.Text>/</InputGroup.Text>
                <FormControl value={this.state.points} disabled={disabled} onChange={(e) => this.inputState(e,'points')} />
              </InputGroup>
              { !generalDisabled && 
                <>
                <div className='flex'>
                  <EditableInput placeholder="Paste imgurs or any link and i'll provide clickable links " value={this.state.proof} textArea={true} stateKey='proof' change={this.inputState} title='Proof' />
                  <div className='flex' style={{flexWrap: 'wrap'}}>
                    { detectURLs(this.state.proof).map((url, i)=> {
                        return <div style={{'margin': '5px'}}> <a target="_blank" href={url}> Link-{i} </a> </div>
                      })
                    }
                  </div>
                </div>
                  <div className="form-check" style={{'marginTop': '15px'}}>
                    <input className="form-check-input" disabled={generalDisabled} checked={this.state.checked} onChange={this.toggleCheck} type="checkbox" value="" id="flexCheckDefault"/>
                    <label className="form-check-label" htmlFor="flexCheckDefault">
                      Completed?
                    </label>
                  </div>
                </>
              } 
            </>
            :
            <>
            { Object.keys(this.listOfImages).map((image, i) => {
              return (
                <img 
                  key={i}
                  title={image}
                  src={this.listOfImages[image]}
                  onClick={() => this.setImage(image.split('.')[0])}
                />
              )
              })  
            }
            <hr/>
            <div>
              Click any image to set it OR
              Type ANY item's name as close as possible and i'll try and find it for you.
              Your text will be edited as you type to aid in searches. (go to wiki and use those names if you're stuck)
              Examples : (Coins, Old school bond, Infernal cape, Bucket of milk, Sigil of the menacing mage, Beaver)
            </div>
            <div style={{'display': 'flex'}}>
              <EditableInput enterAction={this.getImage} value={this.state.wikiSearch} stateKey='wikiSearch' change={this.inputState} title="Item" />
              <Button style={{'height': '38px', 'marginLeft': '15px'}} variant="primary" onClick={this.getImage}>Search</Button>
            </div>
            { this.state.wikiSearchImg &&
              <img 
                src={this.state.wikiSearchImg}
                onClick={() => this.setImage(this.state.wikiSearchImg, true)}
              />
            }
            </>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>Close</Button>
          <Button onClick={this.handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default TileModal

function importAll(r) {
  let images = {};
  r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
  return images;
}

function nameFilter(name){
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function detectURLs(message) {
  if(!message || message.length == 0) {
    return []
  }
  var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  let res = message.match(urlRegex)
  if(!res || res.length == 0) {
    return []
  }
  return res
}