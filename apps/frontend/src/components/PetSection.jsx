import { assetUrl } from '../utils/assetUrl';

const WRAP_SECTIONS = ['Slayer', 'Wilderness'];

export default function PetSection({ section, pets, petInfo, path }) {
  const scale = path === 'pets_pixel';

  return (
    <div className='pet-section'>
      <div className='pet-section-header'>{section}</div>
      <div
        style={WRAP_SECTIONS.includes(section) ? { flexWrap: 'wrap', alignSelf: 'center', width: '80%' } : {}}
        className='pet-section-pets'
      >
        {pets.map((pet) => {
          const petData = petInfo.find(p => p.name === pet);
          return (
            <div key={pet} className='pet-individual' style={{ filter: petData.obtained ? 'brightness(100%)' : 'brightness(40%)' }}>
              <div className="pet-image-container-ofc">
                <img className={`pet-image-ofc ${scale ? 'scaled' : ''}`} src={assetUrl(`${path}/${pet}.png`)} alt={pet} />
              </div>
              {petData.kc ? petData.kc : '-'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
