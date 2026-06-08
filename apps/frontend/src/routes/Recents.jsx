import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Recents.css';

export default function Recents() {
  const [boards, setBoards] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentBoards');
      setBoards(raw ? JSON.parse(raw) : []);
    } catch {
      setBoards([]);
    }
  }, []);

  return (
    <div className="recents-page">
      <div className="recents-panel osrs-glass-raised">
        <h1 className="recents-title osrs-header">📋 Recent Boards</h1>
        <p className="recents-subtitle">
          Your saved board history from this device. This data lives in your browser&apos;s local
          storage.
        </p>

        {boards === null && <p className="recents-status">Loading…</p>}

        {boards !== null && boards.length === 0 && (
          <p className="recents-status recents-empty">
            No recent boards found in local storage on this device.
          </p>
        )}

        {boards !== null && boards.length > 0 && (
          <div className="recents-list">
            {boards.map((board, idx) => (
              <div key={idx} className="recents-row osrs-glass-inset">
                <div className="recents-row-main">
                  <span className="recents-name osrs-header">{board.boardName || '(unnamed)'}</span>
                  {board.adminPassword && (
                    <span className="recents-field">
                      <span className="recents-label">Admin PW:</span>{' '}
                      <code className="recents-code">{board.adminPassword}</code>
                    </span>
                  )}
                  {board.generalPassword && (
                    <span className="recents-field">
                      <span className="recents-label">General PW:</span>{' '}
                      <code className="recents-code">{board.generalPassword}</code>
                    </span>
                  )}
                </div>
                <details className="recents-raw-toggle">
                  <summary>Raw JSON</summary>
                  <pre className="recents-raw">{JSON.stringify(board, null, 2)}</pre>
                </details>
              </div>
            ))}
          </div>
        )}

        <Link className="recents-home osrs-header" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
