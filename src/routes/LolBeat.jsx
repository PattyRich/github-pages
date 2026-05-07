import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LolBeat.css';

function LolBeat() {
  const navigate = useNavigate();
  const [riotId, setRiotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [chain, setChain] = useState([]);
  const [error, setError] = useState('');
  const [found, setFound] = useState(null);

  const getInitials = (name) => name.split('#')[0].substring(0, 2).toUpperCase();

  const startCrawl = async () => {
    if (!riotId.trim()) return;
    setError('');
    setChain([]);
    setFound(null);
    setCrawling(true);
    setJobId(null);

    try {
      const resp = await fetch(`${window.API}/lol/api/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riot_id: riotId.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to enqueue crawl');
      setJobId(data.job_id);
    } catch (err) {
      setError(err.message);
      setCrawling(false);
    }
  };

  const searchChain = async () => {
    if (!riotId.trim()) return;
    setError('');
    setChain([]);
    setFound(null);
    setLoading(true);

    try {
      const resp = await fetch(`${window.API}/lol/api/chain?riot_id=${encodeURIComponent(riotId.trim())}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to fetch chain');
      setFound(data.found);
      setChain(data.chain || []);
      if (!data.found) setError(`No path found yet from ${riotId} to #1. Try crawling first.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lol-container">
      <button className="lol-home-btn" onClick={() => navigate('/')}>← Home</button>

      <header className="lol-header">
        <h1>League of Legends Six Degrees</h1>
        <p>Find the exact sequence of games connecting you to the #1 Challenger player.</p>
      </header>

      <div className="lol-search-box">
        <input
          type="text"
          placeholder="GameName#TagLine"
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchChain()}
        />
        <button onClick={searchChain} disabled={loading || crawling}>
          {loading ? 'Searching…' : 'Find Path'}
        </button>
        <button className="lol-crawl-btn" onClick={startCrawl} disabled={loading || crawling}>
          {crawling ? 'Crawling…' : 'Crawl My Games'}
        </button>
      </div>

      {jobId && (
        <div className="lol-info">
          Crawl job queued! Job ID: <code>{jobId}</code>
          <br />
          <small>This runs in the background. Come back and hit "Find Path" in a minute.</small>
        </div>
      )}

      {(loading || (crawling && !jobId)) && (
        <div className="lol-loading">Searching the beat graph…</div>
      )}

      {error && <div className="lol-error">{error}</div>}

      {chain.length > 0 && (
        <div className="lol-match-list">
          {chain.map((step, index) => {
            const isLast = index === chain.length - 1;
            const title = index === 0 ? 'Start' : isLast ? 'Victory to #1' : `Step ${step.step}`;
            return (
              <div className="lol-match-card" key={index}>
                {step.match_id && (
                  <div className="lol-match-id">{step.match_id}</div>
                )}
                <div className="lol-match-info">
                  <div className="lol-match-type">Ranked Solo</div>
                  <div className="lol-match-time">{title}</div>
                  <div className="lol-match-result">WIN</div>
                </div>
                <div className="lol-match-players">
                  <div className="lol-player lol-winner">
                    <div className="lol-avatar">{getInitials(step.winner)}</div>
                    <div className="lol-player-name">{step.winner}</div>
                  </div>
                  <div className="lol-vs">beat</div>
                  <div className="lol-player lol-loser">
                    <div className="lol-avatar">{getInitials(step.loser)}</div>
                    <div className="lol-player-name">{step.loser}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LolBeat;
