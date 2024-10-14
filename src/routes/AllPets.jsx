import React, {useEffect, useState} from 'react';
import Button from '../components/BootStrap/Button'
import { useNavigate } from "react-router-dom";
import { loot } from '../looter/looter'
import './AllPets.css'


const AllPets = (props) => {
  const navigate = useNavigate();
  const [petList, setPetList] = useState([]);
  const [petData, setPetData] = useState([]);

	useEffect(()=> {
		console.log('rerender')
    import('../looter/all-pets.js')
			.then((data) => {
        let datax = JSON.parse(JSON.stringify(data)).data
        setPetList(datax)
      })

	return () => console.log('tearing down')
	}, [])

  const go = async () => {
    let tempData = []
    for (let i = 0; i < petList.pets.length; i++) {
      let pet = petList.pets[i]
      pet.allPets = true
      tempData.push(await loot('f', 'create', {createData: pet}))
    }    
    tempData = makeGroups(sortData(tempData));
    

    setPetData(tempData)
  }

  function sortData(data){
    return data.sort((a, b) => a[0].rate - b[0].rate);
  } 

  function makeGroups(data){
    let currRate = '0';
    let groups = []
    let tmpGroup = []
    console.log(data)
    for (let i = 0; i < data.length; i++) {
      if (data[i][0].rate.toString()[0] !== currRate) {
        groups.push({rate: currRate, data: tmpGroup})
        currRate = data[i][0].rate.toString()[0]
        tmpGroup = []
        tmpGroup.push(data[i])
      } else {
        tmpGroup.push(data[i])
      }
    }
    groups.push({rate: currRate, data: tmpGroup})
    return groups;
  }
  

	return (
    <div className='main-all-pets'>
      Simulate getting all pets.
      <br />
      Assumes: Red chins, Amethyst mining, Inventories of mind runes, Redwood logs, Penguin Course, Karambwams, Stalls, 30k point cox, 3 man nex, On task jad rek, Teak trees for tangleroot, Phosani's, Singles wilderness pets, destroy araxxor, solo huberte.
      <br />
      <button onClick={go}> Go! </button>
      <Button style={{position: 'absolute', right: '10px', top: '10px'}} click={() => navigate('/')} text="Home" variant="primary"/>

      <div className="items-all-pets">
        
        
      {petData ? petData.map((group, i) => {
        return (<div className='pet-rate' key={group.rate+'-group'}>
          <h4>{`${group.rate}.x Rate`}</h4>
          <div className='pet-rate-items'>
            {group.data.map((pet, j) => {
              return (
              <div key={j}>
                {pet.map((item, i) => { 
                  return (
                    <div key={item} className='item'>
                      <a href={`https://oldschool.runescape.wiki/w/${item.name.split(' ').join('_')}`} target='_blank' rel='noreferrer'>
                        <img src={`${process.env.PUBLIC_URL}/assets/pets_pixel/${item.name}.png`} title={item.name} alt={item.name} />
                      </a>
                      {`${item.kc}`}
                    </div>
                  )
                })}
              </div>)
            })}
          </div>
        </div>)
      }) : null}
      
      
      
      
      </div>
    </div>
	)
}


export default AllPets