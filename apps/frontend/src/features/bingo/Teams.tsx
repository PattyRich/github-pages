import { useState } from 'react';
//import { Link } from "react-router-dom";
import { getStoredBool } from '../../utils/utils';
import Tabs from '../../components/ui/Tabs';
import type { TeamInfo } from '../../components/ui/EditTeams';

interface TeamsProps {
  activeTeam: TeamInfo;
  changeTeam: (teamId: number) => void;
  teams?: TeamInfo[];
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
    props.changeTeam(Number(teamId));
    setKey(teamName);
  }

  const items =
    props.teams?.map((team) => {
      const pointTotal = (team as { pointTotal?: number | string }).pointTotal;
      const showPoints = !showTeamPoints && Number(pointTotal) !== 0;
      return {
        key: team.data.name,
        label: `${team.data.name}${showPoints ? ': (' + String(pointTotal) + ')' : ''}`,
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
