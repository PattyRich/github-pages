import React from 'react';
import Button from './BootStrap/Button'

const Teams = (props) => {
  return (
    <div style={{marginTop: '20px', display: 'flex', 'justifyContent': 'center', alignItems: 'center', flexDirection: 'column'}}>
      Join a recent board.    
      {props.recent && props.recent.map((item, i)=>{
        return (
          <div key={i} className='flex-center' style={{'alignItems': 'center'}}>
            <div style={{margin: '5px'}}>
              <Button variant="outline-primary" click={() => props.click(item)} text={`${item.boardName}-${item.priv}`} />
            </div>
            <Button variant="outline-danger" click={() => props.removeRecent(item.boardName)} text={'X'} />
          </div>
        )
      })}
    </div>
  );
}

export default Teams