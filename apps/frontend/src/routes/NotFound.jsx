import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-panel osrs-glass-raised">
        <p className="notfound-code osrs-header">404</p>
        <h1 className="notfound-title osrs-header">Page not found</h1>
        <p className="notfound-body">
          That path doesn&apos;t exist. You may have followed a broken link or typed the URL
          incorrectly.
        </p>
        <Link className="notfound-home osrs-header" to="/">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
