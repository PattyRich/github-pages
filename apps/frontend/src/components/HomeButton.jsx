import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './HomeButton.css';

export default function HomeButton() {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/^\/github-pages/, '') || '/';

  if (normalizedPath === '/') {
    return null;
  }

  return (
    <Link className="home-button" to="/" aria-label="Go home">
      Home
    </Link>
  );
}
