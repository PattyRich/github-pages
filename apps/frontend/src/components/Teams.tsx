import { useState } from 'react';
//import { Link } from "react-router-dom";
import { getStoredBool } from '../utils/utils';
import Tabs from './ui/Tabs';

interface TeamTabInfo {
  data: {
    name: string;
    [key: string]: unknown;
  };
  pointTotal?: number | string;
  team: number;
}

interface TeamsProps {
  activeTeam: TeamTabInfo;
  changeTeam: (teamId: number) => void;
  teams?: TeamTabInfo[];
}

const Teams = (props: TeamsProps) => {
  const [key, setKey] = useState(props.activeTeam.data.name);
  const showTeamPoints = getStoredBool('showTeamPoints');
  function selectTeam(teamName: string) {
    const teamId = props.teams?.find((team) => {
      return team.data.name === teamName;
    })?.team;
    if (teamId === undefined) return;
    localStorage.setItem('activeTeam', String(teamId));
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
