import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { HashRouter, Routes, Route } from "react-router-dom";

const App = lazy(() => import('./App'));
const Osrs = lazy(() => import('./routes/osrs'));
const Magerun = lazy(() => import('./routes/magerun'));
const Bingo = lazy(() => import('./routes/bingo'));
const BoardView = lazy(() => import('./components/BoardView'));
const BingoDraft = lazy(() => import('./routes/BingoDraft'));
const ToaFlip = lazy(() => import('./routes/ToaFlip'));
const Pets = lazy(() => import('./routes/Pets'));
const AllPets = lazy(() => import('./routes/AllPets'));
const LolBeat = lazy(() => import('./routes/LolBeat'));

const root = ReactDOM.createRoot(document.getElementById('root'));

const IS_MAINTENANCE = false;

window.API = import.meta.env.DEV ? 'http://localhost:8000' : 'https://praynr.com'

const Maintenance = (
	<main style={{
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "100vh",
		background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
		padding: "2rem",
		fontFamily: "'Inter', sans-serif"
	}}>
		<div style={{
			background: "rgba(255, 255, 255, 0.7)",
			backdropFilter: "blur(10px)",
			padding: "3rem",
			borderRadius: "24px",
			boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
			textAlign: "center",
			maxWidth: "500px",
			border: "1px solid rgba(255, 255, 255, 0.5)"
		}}>
			<h1 style={{
				fontFamily: "'Outfit', sans-serif",
				fontWeight: 800,
				fontSize: "2.5rem",
				background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				WebkitBackgroundClip: "text",
				WebkitTextFillColor: "transparent",
				marginBottom: "1rem",
				marginTop: 0
			}}>
				Under Maintenance
			</h1>
			<p style={{ fontSize: "1.2rem", color: "#4a5568", lineHeight: "1.6", margin: 0 }}>
				We're currently performing some updates to improve your experience. Please check back soon!
			</p>
			<div style={{ marginTop: "2rem", fontSize: "3rem" }}>🛠️</div>
		</div>
	</main>
);

root.render(
	<HashRouter>
		<Suspense fallback={<main className="route-loading">Loading...</main>}>
			<Routes>
				<Route path="/" element={<App />} />
				<Route path="/osrs" element={<Osrs />} />
				<Route path="/github-pages/osrs" element={<Osrs />} />
				<Route path="/mage-run" element={<Magerun />} />
				<Route path="/github-pages/mage-run" element={<Magerun />} />
				<Route path="/toa-flip" element={<ToaFlip />} />
				<Route path="/github-pages/toa-flip" element={<ToaFlip />} />
				<Route path="/bingo/create" element={IS_MAINTENANCE ? Maintenance : <Bingo key='create' screenSkip={2} />} />
				<Route path="/github-pages/bingo/create" element={IS_MAINTENANCE ? Maintenance : <Bingo key='create' screenSkip={2} />} />
				<Route path="/bingo/join" element={IS_MAINTENANCE ? Maintenance : <Bingo key='join' screenSkip={4} />} />
				<Route path="/github-pages/bingo/join" element={IS_MAINTENANCE ? Maintenance : <Bingo key='join' screenSkip={4} />} />
				<Route path="/bingo" element={IS_MAINTENANCE ? Maintenance : <Bingo />} />
				<Route path="/github-pages/bingo" element={IS_MAINTENANCE ? Maintenance : <Bingo />} />
				<Route path="/bingo/:boardName" element={IS_MAINTENANCE ? Maintenance : <BoardView />} />
				<Route path="/github-pages/bingo/:boardName" element={IS_MAINTENANCE ? Maintenance : <BoardView />} />
				<Route path="/bingo-draft" element={<BingoDraft />} />
				<Route path="/github-pages/bingo-draft" element={<BingoDraft />} />
				<Route path="/pets" element={<Pets />} />
				<Route path="/github-pages/pets" element={<Pets />} />
				<Route path="/all-pets" element={<AllPets />} />
				<Route path="/github-pages/all-pets" element={<AllPets />} />
				<Route path="/lol-beat" element={IS_MAINTENANCE ? Maintenance : <LolBeat />} />
				<Route path="/github-pages/lol-beat" element={IS_MAINTENANCE ? Maintenance : <LolBeat />} />
				<Route
					path="*"
					element={
						<main style={{ padding: "1rem" }}>
							<p>There's nothing here!</p>
						</main>
					}
				/>
			</Routes>
		</Suspense>
	</HashRouter>
);

reportWebVitals();
