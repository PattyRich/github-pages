import React from 'react';
import { useState } from 'react';
//import { Link } from "react-router-dom";
import { Tab, Tabs } from 'react-bootstrap'

const Teams = (props) => {
  const [key, setKey] = useState(props.activeTeam.data.name);
  const showTeamPoints = localStorage.getItem('showTeamPoints') === 'true';
  function selectTeam(teamName) {
    let teamId = props.teams.find((team)=> {
      return team.data.name === teamName
    }).team
    localStorage.setItem('activeTeam', teamId)
    props.changeTeam(teamId)
    setKey(teamName)
  }
  return (
    <Tabs
      id="controlled-tab-example"
      activeKey={key}
      onSelect={(k) => selectTeam(k)}
      variant="pills"
      style={{'marginBottom': '5px', 'display': 'flex', 'justifyContent': 'center'}}
    >
    { props.teams && props.teams.map((team, i)=> {
        return <Tab key={i} eventKey={team.data.name} title={`${team.data.name} ${!showTeamPoints? ': (' + team.pointTotal + ')' : ''}`} />
      })
    }
    </Tabs>
  );
}

export default Teams