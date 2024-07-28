import './App.css';
import React from 'react';
import { Link } from "react-router-dom";
import Image from 'react-bootstrap/Image'
import Alert from 'react-bootstrap/Alert'
import FeedbackModal from './components/BootStrap/FeedbackModal'
import Form from 'react-bootstrap/Form';
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
} from 'darkreader';

window.API = process.env.NODE_ENV ==='development' ? 'http://localhost:5001' : 'https://praynr.com'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showFeedback: false
    }
  }

  toggleDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
      localStorage.setItem('darkMode', 'false');
      disableDarkMode();
    } else {
      localStorage.setItem('darkMode', 'true');
      enableDarkMode({
        brightness: 100,
        contrast: 90,
        sepia: 10,
      });
    }
    this.forceUpdate();
  }

  render() {
    const darkModeValue = localStorage.getItem('darkMode') === 'true';
      return (
        <div className="App">
          <div style={{'height': '100%'}}>
            <nav>
              <ul id="navigation">
                <li>
                <Link to="/">Home</Link>
                </li>
                <li>
                <Link to="/osrs">Osrs loot simulator</Link>
                </li>
                <li>
                <Link to="/all-pets">Simulate getting all pets</Link>
                </li>
                <li>
                <Link to="/mage-run">Olm Mage run</Link>
                </li>         
                <li>
                <Link to="/toa-flip">Tombs of Amascut Flip Puzzle</Link>
                </li>        
                <li>
                <Link to="/bingo">Bingo</Link>
                </li>    
                <li>
                <Link to="/bingo-draft">Bingo Draft</Link>
                </li>   
                <li>
                <Link to="/pets">Create a Picture for Your Current Pets</Link>
                </li>   
                <li>
                <a target="_blank" href="https://github.com/PattyRich/github-pages"> repo this comes from </a>
              	</li>
              </ul>
            </nav>
            <div style={{marginBottom: '15px', display: 'flex', justifyContent: 'center'}}> 
                <Form.Check // prettier-ignore
                  type="switch"
                  id="custom-switch"
                  label="Dark Mode?"
                  onChange={() => this.toggleDarkMode()}
                  checked={darkModeValue}
                />
              </div>
            <Alert style={{'marginTop': '30px'}}>Check out the Bingo Boards. Keep track of all teams boards in 1 place that can be quickly viewed and edited by anyone. </Alert>
            <div className='flex-center' style={{'height': '50%'}}>
              <Image style={{'padding': '10px'}} fluid={true} src={`${process.env.PUBLIC_URL}/board-min2.png`} />
              <Image style={{'padding': '10px'}} fluid={true} src={`${process.env.PUBLIC_URL}/create-min.png`} />
            </div>
            <hr style={{'margin': 'auto'}} />
          </div>
          <div className='feedback' onClick={()=>this.setState({showFeedback: true})}>
            feedback
          </div>
          {	this.state.showFeedback && 
            <FeedbackModal handleClose={()=> this.setState({showFeedback: false})} />
          }
        </div>
    	);
  }
}

export default App
