import React from 'react';

const TotalLoot = (props) => {
	//useEffect(()=> {})
	return (
		<div className="items">
			{props.loot ? props.loot.map(item => {
				if (item.amount == 0) {
					return null;
				}
     		return (
     			<span className="item">
     				<a href={`https://oldschool.runescape.wiki/w/${item.name.split(' ').join('_')}`} target='_blank' rel='noreferrer'>
     					<img src={'data:image/png;base64,' + props.icons[item.name]} title={item.name} alt={item.name}></img>
     				</a>
     				{item.amount}
     			</span>
     		)
      }) : null}
		</div>
	)
}

export default TotalLoot