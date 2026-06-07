import { useState } from 'react';
//import { Link } from "react-router-dom";
import { getStoredBool } from '../utils/utils';
import Tabs from './ui/Tabs';

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

  const items =
    props.teams?.map((team) => {
      const showPoints = !showTeamPoints && Number(team.pointTotal) !== 0;
      return {
        key: team.data.name,
        label: `${team.data.name}${showPoints ? ': (' + team.pointTotal + ')' : ''}`,
      };
    }) || [];

  return (
    <Tabs
      className="team-tabs"
      items={items}
      activeKey={key}
      onSelect={selectTeam}
      ariaLabel="Teams"
    />
  );
};

export default Teams;
