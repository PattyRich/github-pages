import React from 'react';

class PetSection extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount(){
  }
  
  render() {
    return (<>
        <div className='pet-section'>
          <div className='pet-section-header'>
           {this.props.section}
          </div>
          <div style={this.props.section === 'Slayer' ? {'flexWrap': 'wrap' , 'alignSelf': 'center', 'width': '80%'}: {}} className='pet-section-pets'>
            {this.props.pets.map((pet, i) => {
              let petData = this.props.petInfo.find(petFind => petFind.name === pet)
              return (
                <div className='pet-individual' style={{filter: petData.obtained ? 'brightness(100%)': 'brightness(60%)'}}>
                  <div className="pet-image-container-ofc">   
                    <img className='pet-image-ofc' src={`${process.env.PUBLIC_URL}/assets/detailed_pets/${pet}.png`} />
                  </div >
                  {petData.kc ? petData.kc : '-'}
                </div>
                )
            })}
          </div>
        </div>
    </>)
  }
}

export default PetSection