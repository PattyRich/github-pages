import React, { useEffect } from 'react';
import { assetUrl } from '../utils/assetUrl';

const TotalLoot = (props) => {
  useEffect(() => {
    console.log('rerender');
    return () => console.log('tearing down');
  }, []);
  return (
    <div className="items">
      {props.loot
        ? props.loot.map((item) => {
            if (item.amount == 0) {
              return null;
            }
            return (
              <span className="item">
                <a
                  href={`https://oldschool.runescape.wiki/w/${item.name.split(' ').join('_')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={assetUrl(`${item.name}.png`)} title={item.name} alt={item.name}></img>
                </a>
                {item.amount}
              </span>
            );
          })
        : null}
    </div>
  );
};

export default TotalLoot;
