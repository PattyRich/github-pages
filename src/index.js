import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Osrs from './routes/osrs';
import Magerun from './routes/magerun'
import Bingo from './routes/bingo'
import BoardView from './components/BoardView'
import reportWebVitals from './reportWebVitals';
import BingoDraft from './routes/BingoDraft';
import ToaFlip from './routes/ToaFlip';
import Pets from './routes/Pets';
import AllPets from './routes/AllPets';
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
  auto as followSystemColorScheme,
  isEnabled as isDarkReaderEnabled
} from 'darkreader';

import { HashRouter, Routes, Route } from "react-router-dom";

followSystemColorScheme();
let darkMode = localStorage.getItem('darkMode');
if (darkMode === null) {
	localStorage.setItem('darkMode', isDarkReaderEnabled());
	darkMode = isDarkReaderEnabled();
}
if (darkMode === 'true') {
	enableDarkMode({
    brightness: 100,
    contrast: 90,
    sepia: 10,
	});
} else {
	disableDarkMode();
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  	<HashRouter>
  		<Routes>
  			<Route path="/" element={<App />} />
  			<Route path="/osrs" element={<Osrs />} />
  			<Route path="/github-pages/osrs" element={<Osrs />} />
   			<Route path="/mage-run" element={<Magerun />} />
  			<Route path="/github-pages/mage-run" element={<Magerun />} />
				<Route path="/toa-flip" element={<ToaFlip />} />
  			<Route path="/github-pages/toa-flip" element={<ToaFlip />} />
				<Route path="/bingo/create" element={<Bingo key='create' screenSkip={2} />} />
				<Route path="/github-pages/bingo/create" element={<Bingo key='create' screenSkip={2} />} />
				<Route path="/bingo/join" element={<Bingo key='join' screenSkip={4} />} />
				<Route path="/github-pages/bingo/join" element={<Bingo key='join' screenSkip={4} />} />
				<Route path="/bingo" element={<Bingo />} />
  			<Route path="/github-pages/bingo" element={<Bingo />} />
				<Route path="/bingo/:boardName" element={<BoardView />} />
  			<Route path="/github-pages/bingo/:boardName" element={<BoardView />} />
				<Route path="/bingo-draft" element={<BingoDraft />} />
  			<Route path="/github-pages/bingo-draft" element={<BingoDraft />} />				
				<Route path="/pets" element={<Pets />} />
  			<Route path="/github-pages/pets" element={<Pets />} />			
				<Route path="/all-pets" element={<AllPets />} />
  			<Route path="/github-pages/all-pets" element={<AllPets />} />	
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
  );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
