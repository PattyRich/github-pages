import { useState } from 'react';
//import { Link } from "react-router-dom";
import { getStoredBool } from '../utils/utils';
import './Teams.css';

const Teams = (props) => {
  const [key, setKey] = useState(props.activeTeam.data.name);
  const showTeamPoints = getStoredBool('showTeamPoints');
  function selectTeam(teamName) {
    let teamId = props.teams.find((team) => {
      return team.data.name === teamName;
    }).team;
    localStorage.setItem('activeTeam', teamId);
    props.changeTeam(teamId);
    setKey(teamName);
  }
  return (
    <div className="team-tabs" role="tablist" aria-label="Teams">
      {props.teams &&
        props.teams.map((team, i) => {
          const showPoints = !showTeamPoints && Number(team.pointTotal) !== 0;
          const label = `${team.data.name}${showPoints ? ': (' + team.pointTotal + ')' : ''}`;
          return (
            <button
              key={i}
              type="button"
              className={`team-tab ${key === team.data.name ? 'active' : ''}`}
              role="tab"
              aria-selected={key === team.data.name}
              onClick={() => selectTeam(team.data.name)}
            >
              {label}
            </button>
          );
        })}
    </div>
  );
};

export default Teams;
