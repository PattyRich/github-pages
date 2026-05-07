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
import LolBeat from './routes/LolBeat';
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
if (darkMode === 'true' || darkMode === true) {
	enableDarkMode({
		brightness: 100,
		contrast: 90,
		sepia: 10,
	});
} else {
	disableDarkMode();
}

const root = ReactDOM.createRoot(document.getElementById('root'));

const Maintenance = (
	<main style={{ padding: "1rem" }}>
		<p>Undergoing maintenance</p>
	</main>
);


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
			<Route path="/bingo/create" element={Maintenance} />
			<Route path="/github-pages/bingo/create" element={Maintenance} />
			<Route path="/bingo/join" element={Maintenance} />
			<Route path="/github-pages/bingo/join" element={Maintenance} />
			<Route path="/bingo" element={Maintenance} />
			<Route path="/github-pages/bingo" element={Maintenance} />
			<Route path="/bingo/:boardName" element={Maintenance} />
			<Route path="/github-pages/bingo/:boardName" element={Maintenance} />
			<Route path="/bingo-draft" element={Maintenance} />
			<Route path="/github-pages/bingo-draft" element={Maintenance} />
			<Route path="/pets" element={<Pets />} />
			<Route path="/github-pages/pets" element={<Pets />} />
			<Route path="/all-pets" element={<AllPets />} />
			<Route path="/github-pages/all-pets" element={<AllPets />} />
			<Route path="/lol-beat" element={Maintenance} />
			<Route path="/github-pages/lol-beat" element={Maintenance} />
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

reportWebVitals();
