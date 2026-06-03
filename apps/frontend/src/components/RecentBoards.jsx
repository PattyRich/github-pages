import React from 'react';
import Button from './BootStrap/Button';

const Teams = (props) => {
  return (
    <div className="recent-board-list">
      <h2 className="osrs-header">Recent Boards</h2>
      {props.recent &&
        props.recent.map((item, i) => {
          return (
            <div key={i} className="recent-board-row">
              <div className="recent-board-meta">
                <strong>{item.boardName}</strong>
                <span>{item.priv}</span>
              </div>
              <div className="recent-board-actions">
                <Button variant="success" click={() => props.click(item)} text="Join" />
                <Button
                  variant="outline-danger"
                  click={() => props.removeRecent(item.boardName)}
                  text="Remove"
                />
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default Teams;
