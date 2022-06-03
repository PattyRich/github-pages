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
import { HashRouter, Routes, Route } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  	<HashRouter>
  		<Routes>
  			<Route path="/" element={<App />} />
  			<Route path="/osrs" element={<Osrs />} />
  			<Route path="/github-pages/osrs" element={<Osrs />} />
   			<Route path="/mage-run" element={<Magerun />} />
  			<Route path="/github-pages/mage-run" element={<Magerun />} />
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
