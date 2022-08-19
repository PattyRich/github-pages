import './App.css';
import React from 'react';
import { Link } from "react-router-dom";
import Image from 'react-bootstrap/Image'
import Alert from 'react-bootstrap/Alert'

window.API = process.env.NODE_ENV ==='development' ? 'http://localhost:5001' : 'https://baron.gg'

class App extends React.Component {
  render() {
      return (
        <div className="App">
          <div style={{'height': '100%'}}>
            <nav>
              <ul id="navigation">
                <li>
                <Link to="/">Home</Link>
                </li>
                <li>
                <Link to="/osrs">Osrs loot simulator.</Link>
                </li>
                <li>
                <Link to="/mage-run">Olm Mage run</Link>
                </li>            
                <li>
                <Link to="/bingo">Bingo</Link>
                </li>    
                <li>
                <Link to="/bingo-draft">Bingo Draft</Link>
                </li>   
                <li>
                <a target="_blank" href="https://github.com/PattyRich/github-pages"> repo this comes from </a>
              	</li>
              </ul>
            </nav>
            <Alert style={{'marginTop': '30px'}}>Check out the Bingo Boards. Keep track of all teams boards in 1 place that can be quickly viewed and edited by anyone. </Alert>
            <div className='flex-center' style={{'height': '50%'}}>
              <Image style={{'padding': '10px'}} fluid={true} src={`${process.env.PUBLIC_URL}/board-min2.png`} />
              <Image style={{'padding': '10px'}} fluid={true} src={`${process.env.PUBLIC_URL}/create-min.png`} />
            </div>
            <hr style={{'margin': 'auto'}} />
          </div>
        </div>
    	);
  }
}

export default App