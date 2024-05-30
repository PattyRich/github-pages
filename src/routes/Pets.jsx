import React from 'react';
//import { Link } from "react-router-dom";
import './Pets.css'
import {data} from '../looter/pets-list';
import PetSection from '../components/PetSection';

import { toPng } from 'html-to-image';

let backgrounds = ['black', 'black2', 'black3', 'black5', 'purple1'];
//https://oldschool.runescape.wiki/images/thumb/Rocky_(follower).png/560px-Rocky_(follower).png
//https://oldschool.runescape.wiki/images/' + urllib.parse.quote(urlName) + '.png
class Pets extends React.Component {
  constructor(props) {
    super(props);

    let petData = []
    for (const section in data) {
      for (const pet of data[section]) {
        petData.push({name: pet, obtained: false, kc: '-'})
      }
    }
    this.state = {
      petInfo: petData,
      name: 'Cool Player',
      info:'(13/59)',
      background: 0
    }
    this.toggleCheck = this.toggleCheck.bind(this);
    this.changeKc = this.changeKc.bind(this);
    this.changeInput = this.changeInput.bind(this);
    this.switchBackground = this.switchBackground.bind(this);
  }

  componentDidMount(){
    setInterval(()=> {
      localStorage.setItem('pets', JSON.stringify(this.state.petInfo))
    },30000)
    let petData = localStorage.getItem('pets')
    if (petData){
      petData = JSON.parse(petData)
      let newPetData = [...this.state.petInfo];
      for (const pet of petData) {
        let index = newPetData.findIndex(newPet => newPet.name === pet.name)
        if (index > -1) {
          newPetData[index] = pet
        }
      }
      this.setState({petInfo: newPetData})
    }
  }

  download() {   
    var node = document.getElementById('pet-preview');

    toPng(node)
      .then(function (dataUrl) {
        var download = document.createElement('a');
        download.href = dataUrl;
        download.download = 'pets.png';
        download.click();
      })
      .catch(function (error) {
        console.error('oops, something went wrong!', error);
      });
  }

  changeInput(stateName, val){
    let stateChange = {}
    stateChange[stateName] = val
    this.setState(stateChange);
  }

  switchBackground(){
    let newbg = this.state.background
    newbg += 1
    if (newbg >= backgrounds.length) {
      newbg = 0
    }
    console.log(this.state,newbg)
    this.setState({background: newbg})
  }

  toggleCheck(i) {
    let pets =  [...this.state.petInfo];
    pets[i].obtained = !pets[i].obtained;
    this.setState({petInfo: pets});
  }

  changeKc(i, val) {
    let pets =  [...this.state.petInfo];
    pets[i].kc = val;
    if (val !== '' && val !== '-') {
      pets[i].obtained = true;
    }
    this.setState({petInfo: pets});
  }
  
  render() {
    return (<>
    <h4 style={{'textAlign': 'center'}}>Create a Pet Picture</h4>
    <p style={{'textAlign': 'center'}}>Mark the checkbox if the pet is obtained and fill the input with either kc or exp / anything else you want</p>
    <div className='pet-user-input' style={{'textAlign': 'center', 'marginBottom': '10px'}}>
      Your name?
      <input value={this.state.name} onChange={(e) => this.changeInput('name', e.target.value)}></input>
      Any info you want to display. (optional)
      <input value={this.state.info} onChange={(e) => this.changeInput('info', e.target.value)}></input>
    </div>
    <div className="pet-container">
      {this.state.petInfo.map((pet, i) => {
        // let urlName = encodeURIComponent(urlHelper(pet.name).replaceAll(' ', '_'));
        return (<div className='pet-info'>   
          {/* <div className="pet-image-container">   
           <img src={'https://oldschool.runescape.wiki/images/' + urlName + '.png'} />
          </div> */}
          <div className="pet-image-container">   
           <img className='pet-image' src={`${process.env.PUBLIC_URL}/assets/detailed_pets/${pet.name}.png`} />
          </div>
          <input className="form-check-input" checked={pet.obtained} onChange={() => this.toggleCheck(i)} type="checkbox" value="" id={"pet" + i}/>
          {/* <label className="form-check-label" htmlFor={"pet" + i}>
          </label> */}
          <div className='pet-kc-input-container'>
            <input className='pet-kc-input' value={pet.kc} onChange={(e) => this.changeKc(i, e.target.value)}></input>
          </div>
        </div>)
      })}
      </div>
      <br/>
      The download button is going to give you an image exactly how the image below looks on your browser, so increase and decrease your window size to get it exacatly how you want it. You may need to disable chrome extensions like darkreader for this to load everything correctly.
      <div className='pet-buttons'> 
        <button style={{'marginRight': '5px'}} onClick={this.switchBackground}> Switch Background </button>
        <button onClick={this.download}>Download</button>
      </div>
      
      <div style={{'backgroundImage': `url(${process.env.PUBLIC_URL}/assets/backgrounds/${backgrounds[this.state.background]}.jpg)`}} id="pet-preview" className='pet-preview'>
        <PetSection petInfo={this.state.petInfo} pets={data['Raids']} section='Raids'/>
        <PetSection petInfo={this.state.petInfo} pets={data['Bosses']} section='Bosses'/>
        <div className='pets-middle'>
          <div className='left-container'>
            <div className='pets-left'>
            <PetSection petInfo={this.state.petInfo} pets={data['Slayer']} section='Slayer'/>
            </div>
            <div className='pets-left'>
            <PetSection petInfo={this.state.petInfo} pets={data['DT2']} section='DT 2'/>
            </div>
          </div>
          <div className='pet-center-info' style={{fontFamily: 'osrsFont'}}>
            <h4 className='pet-name'>{this.state.name}</h4>
            {this.state.info}
          </div>
          <div className='right-container'>
            <div className='pets-right'>
              <PetSection petInfo={this.state.petInfo} pets={data['Wilderness']} section='Wilderness'/>
            </div>
            <div className='pets-right'>
              <PetSection petInfo={this.state.petInfo} pets={data['GodWars']} section='GodWars'/>
            </div>
          </div>
        </div>
        <PetSection petInfo={this.state.petInfo} pets={data['Skilling']} section='Skilling'/>
        <PetSection petInfo={this.state.petInfo} pets={data['Other']} section='Other'/>
      </div>
    </>)
  }
}

export default Pets

const urlHelper = (name) => {
  if (name.includes('hydra')) {
    name += ' (serpentine)'
  }
  if (name.includes('Muphin')) {
    name += ' (ranged)'
  }
  if (name.includes('Baby chin')) {
    name += ' (grey)'
  }
  if (name.includes('Rift guardian')) {
    name += ' (fire)'
  }
  return name
}