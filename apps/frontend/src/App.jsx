import './App.css';
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import Image from 'react-bootstrap/Image'
import FeedbackModal from './components/BootStrap/FeedbackModal'

window.API = import.meta.env.DEV ? 'http://localhost:8000' : 'https://praynr.com'

const ROUTES = [
  { path: "/bingo-draft", name: "📝 Bingo Draft", desc: "Draft teams and items for your next big bingo event." },
  { path: "/bingo", name: "🎲 OSRS Bingo", desc: "Interactive bingo boards for your clan events.", premium: true },
  { path: "/osrs", name: "💰 OSRS Loot Simulator", desc: "Simulate drops from Old School RuneScape bosses.", premium: true },
  { path: "/all-pets", name: "🐾 All Pets Simulator", desc: "See how long it takes to get every pet." },
  { path: "/mage-run", name: "🧙 Olm Mage Run", desc: "Practice your Olm Mage hand running." },
  { path: "/toa-flip", name: "🧩 ToA Flip Puzzle", desc: "Master the Tombs of Amascut memory puzzle." },
  { path: "/pets", name: "📸 Pet Picture Creator", desc: "Generate an image showcasing your current pets." },
  { path: "/lol-beat", name: "⚔️ LoL Beat #1 (NA)", desc: "Six Degrees to Challenger — League of Legends pathfinding." },
  { path: "/status", name: "🟢 System Status", desc: "Live health of the API, database, and background workers." },
  { path: "https://github.com/PattyRich/github-pages", name: "🐙 GitHub Repository", desc: "View the source code for this site.", external: true },
];

const BINGO_ROUTES = [
  { path: "/bingo", name: "🎲 OSRS Bingo", desc: "Interactive bingo boards for your clan events. Track all teams in one place." },
  { path: "/bingo-draft", name: "📝 Bingo Draft", desc: "Draft teams and items for your next big bingo event." },
];

export default function App() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="App">
      <div className="app-container">
        <main className="app-main">

          <section className="other-routes-section">
            <h2 className="section-title">Tools &amp; Simulators</h2>
            <div className="route-grid">
              {ROUTES.map((route, idx) => {
                const cls = `route-card${route.premium ? ' premium-card' : ''}`;
                const inner = (
                  <>
                    <h4>{route.name}</h4>
                    <p>{route.desc}</p>
                  </>
                );
                return route.external ? (
                  <a href={route.path} target="_blank" rel="noreferrer" key={idx} className={cls}>
                    {inner}
                  </a>
                ) : (
                  <Link to={route.path} key={idx} className={cls}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="bingo-section">
            <div className="bingo-layout">
              <div className="bingo-text-area">
                <div className="section-header">
                  <h2 className="section-title">Featured: Bingo Tools</h2>
                  <p>The complete toolkit for Old School RuneScape clan bingo events.</p>
                </div>
                <div className="bingo-cards">
                  {BINGO_ROUTES.map((route, idx) => (
                    <Link to={route.path} key={idx} className="route-card premium-card">
                      <h4>{route.name}</h4>
                      <p>{route.desc}</p>
                      <div className="card-action">Launch &rarr;</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bingo-previews">
                <Image
                  className="preview-img"
                  fluid
                  src={`${import.meta.env.BASE_URL}board-min2.png`}
                  alt="Bingo Board Preview"
                />
                <Image
                  className="preview-img"
                  fluid
                  src={`${import.meta.env.BASE_URL}create-min.png`}
                  alt="Bingo Create Preview"
                />
              </div>
            </div>
          </section>

        </main>
      </div>

      <button className="feedback-btn" onClick={() => setShowFeedback(true)}>
        Feedback
      </button>

      {showFeedback && (
        <FeedbackModal handleClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
