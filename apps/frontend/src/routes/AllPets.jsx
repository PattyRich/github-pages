import { useEffect, useState } from 'react';
import { loot } from '../looter/looter';
import './AllPets.css';
import { assetUrl } from '../utils/assetUrl';

const AllPets = (props) => {
  const [petList, setPetList] = useState([]);
  const [petData, setPetData] = useState([]);

  useEffect(() => {
    import('../looter/all-pets.js').then((data) => {
      let datax = JSON.parse(JSON.stringify(data)).data;
      setPetList(datax);
    });
  }, []);

  const go = async () => {
    let tempData = [];
    for (let i = 0; i < petList.pets.length; i++) {
      let pet = petList.pets[i];
      pet.allPets = true;
      tempData.push(await loot('f', 'create', { createData: pet }));
    }
    tempData = makeGroups(sortData(tempData));

    setPetData(tempData);
  };

  function sortData(data) {
    return data.sort((a, b) => a[0].rate - b[0].rate);
  }

  function makeGroups(data) {
    let currRate = '0';
    let groups = [];
    let tmpGroup = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i][0].rate.toString()[0] !== currRate) {
        groups.push({ rate: currRate, data: tmpGroup });
        currRate = data[i][0].rate.toString()[0];
        tmpGroup = [];
        tmpGroup.push(data[i]);
      } else {
        tmpGroup.push(data[i]);
      }
    }
    groups.push({ rate: currRate, data: tmpGroup });
    return groups;
  }

  return (
    <div className="main-all-pets route-dark-bg pets-theme">
      <div
        className="osrs-container"
        style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px' }}
      >
        <h3 className="osrs-header" style={{ textAlign: 'center', marginBottom: '10px' }}>
          All Pets Simulator
        </h3>

        <div
          className="osrs-glass"
          style={{ padding: '10px', marginBottom: '15px', textAlign: 'center' }}
        >
          <div
            className="osrs-glass-raised"
            style={{ padding: '8px', fontSize: '0.85rem', marginBottom: '10px', textAlign: 'left' }}
          >
            <strong>Assumed Methods:</strong> Red chins, Amethyst mining, Mind runes, Redwood logs,
            Penguin Course, Karambwams, Stalls, 30k point COX, 3-man NEX, On-task Jad/Zuk, Teak
            trees, Phosani's, Singles Wildy, Araxxor, Solo Huberte, Soup Port, Dom Sacrifice, Wave 9
            Delve.
          </div>
          <button
            className="osrs-btn"
            style={{ fontSize: '1rem', padding: '5px 25px' }}
            onClick={go}
          >
            Start Simulation!
          </button>
        </div>

        <div
          className="items-all-pets"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '10px',
            padding: '0',
          }}
        >
          {petData && petData.length > 0 && petData[0].data.length > 0 ? (
            petData.map((group, i) => {
              if (group.data.length === 0) return null;
              return (
                <div
                  className="pet-rate osrs-glass"
                  key={group.rate + '-group'}
                  style={{ padding: '10px' }}
                >
                  <h5
                    className="osrs-header"
                    style={{
                      borderBottom: '1px solid var(--osrs-border-dark)',
                      paddingBottom: '3px',
                      marginBottom: '10px',
                      fontSize: '0.95rem',
                    }}
                  >
                    {`${group.rate}.x Rate`}
                  </h5>
                  <div
                    className="pet-rate-items"
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}
                  >
                    {group.data.map((pet, j) => {
                      return (
                        <div key={j} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {pet.map((item, k) => (
                            <div
                              key={k}
                              className="item osrs-glass-raised"
                              style={{ padding: '4px', textAlign: 'center', minWidth: '60px' }}
                            >
                              <a
                                href={`https://oldschool.runescape.wiki/w/${item.name.split(' ').join('_')}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={assetUrl(`pets_pixel/${item.name}.png`)}
                                  title={item.name}
                                  alt={item.name}
                                  style={{ display: 'block', margin: '0 auto 2px', width: '24px' }}
                                />
                              </a>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {item.kc}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.6, marginTop: '20px' }}
            >
              Click "Start Simulation!" to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllPets;
