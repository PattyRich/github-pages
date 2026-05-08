import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LolBeat.css';

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com/cdn';
const DDRAGON_FALLBACK = '16.9.1';

function LolBeat() {
  const navigate = useNavigate();
  const [riotId, setRiotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [chain, setChain] = useState([]);
  const [error, setError] = useState('');
  const [found, setFound] = useState(null);
  const [ddVersion, setDdVersion] = useState(DDRAGON_FALLBACK);

  useEffect(() => {
    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      .then((res) => res.json())
      .then((versions) => {
        if (Array.isArray(versions) && versions.length > 0) {
          setDdVersion(versions[0]);
        }
      })
      .catch(() => { }); // silently fall back to hardcoded version
  }, []);

  const champIcon = (name) => `${DDRAGON_BASE}/${ddVersion}/img/champion/${name}.png`;

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

  const formatTimeAgo = (epochMs) => {
    if (!epochMs) return '';
    const diff = Date.now() - epochMs;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(epochMs).toLocaleDateString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const renderTeamRow = (player, step) => {
    const isChainPlayer =
      player.puuid === step.winner_puuid || player.puuid === step.loser_puuid;
    const isWinner = player.puuid === step.winner_puuid;
    const isLoser = player.puuid === step.loser_puuid;

    let highlightClass = '';
    if (isWinner) highlightClass = 'lol-highlight-winner';
    else if (isLoser) highlightClass = 'lol-highlight-loser';

    return (
      <div
        className={`lol-team-player ${highlightClass}`}
        key={player.puuid}
      >
        <img
          className="lol-champ-icon"
          src={champIcon(player.champion)}
          alt={player.champion}
          title={player.champion}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className={`lol-team-player-name ${isChainPlayer ? 'lol-chain-player' : ''}`}>
          {player.summoner_name.split('#')[0]}
        </span>
        <span className="lol-team-player-kda">
          <span className="lol-k">{player.kills}</span>
          <span className="lol-slash">/</span>
          <span className="lol-d">{player.deaths}</span>
          <span className="lol-slash">/</span>
          <span className="lol-a">{player.assists}</span>
        </span>
      </div>
    );
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
            const team1 = step.participants.filter((p) => p.team_id === 100);
            const team2 = step.participants.filter((p) => p.team_id === 200);
            const winners = team1[0]?.win ? team1 : team2;
            const losers = team1[0]?.win ? team2 : team1;
            const hasDetail = step.participants.length > 0;

            return (
              <div className="lol-match-card" key={index}>
                {/* Left sidebar — game info */}
                <div className="lol-match-sidebar">
                  <div className="lol-match-type">Ranked Solo</div>
                  <div className="lol-match-step">{title}</div>
                  {step.game_date && (
                    <div className="lol-match-date">{formatTimeAgo(step.game_date)}</div>
                  )}
                  {step.game_duration && (
                    <div className="lol-match-duration">{formatDuration(step.game_duration)}</div>
                  )}
                  <div className="lol-match-result">WIN</div>
                </div>

                {/* Divider */}
                <div className="lol-match-divider" />

                {/* Main content — teams */}
                {hasDetail ? (
                  <div className="lol-match-teams">
                    <div className="lol-team lol-team-blue">
                      <div className="lol-team-label">
                        Victory
                      </div>
                      {winners.map((p) => renderTeamRow(p, step))}
                    </div>
                    <div className="lol-team lol-team-red">
                      <div className="lol-team-label">
                        Defeat
                      </div>
                      {losers.map((p) => renderTeamRow(p, step))}
                    </div>
                  </div>
                ) : (
                  <div className="lol-match-players-simple">
                    <span className="lol-chain-player">{step.winner}</span>
                    <span className="lol-vs">beat</span>
                    <span className="lol-chain-player">{step.loser}</span>
                  </div>
                )}

                {step.match_id && (
                  <div className="lol-match-id">{step.match_id}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LolBeat;
