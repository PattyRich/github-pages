import './App.css';
import React from 'react';
import { Link } from "react-router-dom";

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