import './App.css';
import React from 'react';
import { Link } from "react-router-dom";

window.API = process.env.NODE_ENV ==='development' ? 'http://localhost:5001' : ''

class App extends React.Component {
  render() {
      return (
        <div className="App">
          <div>
            <nav>
              <ul id="navigation">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                <Link to="/osrs">osrs</Link>
                </li>
                <li>
                <Link to="/mage-run">Mage run</Link>
                </li>            
                <li>
                <Link to="/bingo">Bingo</Link>
                </li>    
                <li>
                <a href="https://github.com/PattyRich/github-pages"> repo this comes from </a>
              	</li>
              </ul>
            </nav>
          </div>
        </div>
    	);
  }
}

export default App