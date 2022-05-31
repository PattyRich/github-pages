import React from 'react';
import { useState } from 'react';
//import { Link } from "react-router-dom";
import { Tab, Tabs } from 'react-bootstrap'

const Teams = (props) => {
  console.log(props)
  const [key, setKey] = useState(props.activeTeam.data.name);
  function selectTeam(teamName) {
    let teamId = props.teams.find((team)=> {
      return team.data.name === teamName
    }).team
    props.changeTeam(teamId)
    setKey(teamName)
  }
  console.log(props)
  return (
    <Tabs
      id="controlled-tab-example"
      activeKey={key}
      onSelect={(k) => selectTeam(k)}
      variant="pills"
      style={{'marginBottom': '5px'}}
    >
    { props.teams && props.teams.map((team, i)=> {
        return <Tab key={i} eventKey={team.data.name} title={team.data.name} />
      })
    }
    </Tabs>
  );
}

export default Teams