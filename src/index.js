import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Osrs from './routes/osrs';
import reportWebVitals from './reportWebVitals';
import { HashRouter, Routes, Route } from "react-router-dom";


ReactDOM.render(
  <React.StrictMode>
  	<HashRouter>
  		<Routes>
  			<Route path="/" element={<App />} />
  			<Route path="/osrs" element={<Osrs />} />
  			<Route path="/github-pages/osrs" element={<Osrs />} />
  			<Route
		      path="*"
		      element={
		        <main style={{ padding: "1rem" }}>
		          <p>There's nothing here!</p>
		        </main>
		      }
    		/>
  		</Routes>
		</HashRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
