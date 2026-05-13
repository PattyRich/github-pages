import './App.css';
import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Image from 'react-bootstrap/Image'
import FeedbackModal from './components/BootStrap/FeedbackModal'
import Form from 'react-bootstrap/Form';
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
} from 'darkreader';

window.API = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://praynr.com'

const ROUTES = [
  { path: "/bingo-draft", name: "📝 Bingo Draft", desc: "Draft teams and items for your next big bingo event." },
  { path: "/bingo", name: "🎲 OSRS Bingo", desc: "Interactive bingo boards for your clan events.", premium: true },
  { path: "/osrs", name: "💰 OSRS Loot Simulator", desc: "Simulate drops from Old School RuneScape bosses.", premium: true },
  { path: "/all-pets", name: "🐾 All Pets Simulator", desc: "See how long it takes to get every pet." },
  { path: "/mage-run", name: "🧙 Olm Mage Run", desc: "Practice your Olm Mage hand running." },
  { path: "/toa-flip", name: "🧩 ToA Flip Puzzle", desc: "Master the Tombs of Amascut memory puzzle." },
  { path: "/pets", name: "📸 Pet Picture Creator", desc: "Generate an image showcasing your current pets." },
  { path: "/lol-beat", name: "🏆 LoL Beat #1", desc: "Six Degrees to Challenger: League pathfinding." },
  { path: "https://github.com/PattyRich/github-pages", name: "💻 GitHub Repository", desc: "View the source code for this site.", external: true },

];

const BINGO_ROUTES = [
  { path: "/bingo", name: "🎲 OSRS Bingo", desc: "Interactive bingo boards for your clan events. Keep track of all teams in one place." },
  { path: "/bingo-draft", name: "📝 Bingo Draft", desc: "Draft teams and items for your next big bingo event." },
];

export default function App() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (isDarkMode) {
      enableDarkMode({ brightness: 100, contrast: 90, sepia: 10 });
    } else {
      disableDarkMode();
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    localStorage.setItem('darkMode', newVal ? 'true' : 'false');
    setIsDarkMode(newVal);
  };

  return (
    <div className="App">
      <div className={`theme-toggle ${isDarkMode ? 'dark' : ''}`} onClick={toggleDarkMode}>
        <div className="toggle-track">
          <div className="toggle-thumb">
            {isDarkMode ? '🌙' : '☀️'}
          </div>
        </div>
        <span className="toggle-label">Dark Mode</span>
      </div>

      <div className="app-container">
        <main className="app-main">
          {/* Other Routes */}
          <section className="other-routes-section">
            <h3>Tools & Simulators</h3>
            <div className="route-grid">
              {ROUTES.map((route, idx) => {
                const cardClass = `route-card ${route.premium ? 'premium-card' : ''}`;
                const CardContent = (
                  <>
                    <h4>{route.name}</h4>
                    <p>{route.desc}</p>
                  </>
                );
                return route.external ? (
                  <a href={route.path} target="_blank" rel="noreferrer" key={idx} className={cardClass}>
                    {CardContent}
                  </a>
                ) : (
                  <Link to={route.path} key={idx} className={cardClass}>
                    {CardContent}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Highlighted Bingo Section */}
          <section className="bingo-section">
            <div className="bingo-layout">
              <div className="bingo-text-area">
                <div className="section-header">
                  <h2>Featured: Bingo Tools</h2>
                  <p>The ultimate toolkit for Old School RuneScape clan bingo events.</p>
                </div>

                <div className="bingo-cards">
                  {BINGO_ROUTES.map((route, idx) => (
                    <Link to={route.path} key={idx} className="route-card premium-card">
                      <h3>{route.name}</h3>
                      <p>{route.desc}</p>
                      <div className="card-action">Launch App →</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bingo-previews">
                <Image className="preview-img" fluid src={`${process.env.PUBLIC_URL}/board-min2.png`} alt="Bingo Board Preview" />
                <Image className="preview-img" fluid src={`${process.env.PUBLIC_URL}/create-min.png`} alt="Bingo Create Preview" />
              </div>
            </div>
          </section>
        </main>
      </div>

      <button className='feedback-btn' onClick={() => setShowFeedback(true)}>
        Feedback
      </button>

      {showFeedback &&
        <FeedbackModal handleClose={() => setShowFeedback(false)} />
      }
    </div>
  );
}
