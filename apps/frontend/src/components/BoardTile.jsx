import { useState } from 'react';
import './BoardTile.css';
import Modal from './BootStrap/TileModal';
import { getStoredBool } from '../utils/utils';

const CROSS_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='red' stroke-width='3'/><path d='M0 0 L100 100 ' stroke='red' stroke-width='3'/></svg>";

export default function BoardTile({ cord, change, info, teamInfo, dem, br, bb, privilage, bare }) {
  const [showModal, setShowModal] = useState(false);

  const checked = teamInfo?.checked;
  const completeStyle = getStoredBool('completeStyle');
  const showPoints = getStoredBool('showPoints');
  const showTitleTile = getStoredBool('showTitleTile');
  const showTileTitle = !bare && !showTitleTile && info?.title;
  const showTeamProgress = info && teamInfo && info.points > 0 && !showPoints;

  const sizeStyle = dem ? { height: dem, width: dem } : {};
  const titleStyle = showTileTitle
    ? { '--tile-title-font-size': getTileTitleFontSize(info.title) }
    : undefined;

  let bgHeight = null;
  if (teamInfo) {
    if (checked) {
      bgHeight = '100%';
    } else if (info?.points > 0) {
      bgHeight = Math.round((teamInfo.currPoints / info.points) * 100) + '%';
    }
  }

  function openTile() {
    setShowModal(true);
  }

  function handleTileKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openTile();
    }
  }

  return (
    <>
      <span
        className={`tile-wrapper ${!completeStyle && checked ? 'green-bg' : ''}`}
        style={{ '--bgHeight': bgHeight }}
        title={info?.title || undefined}
      >
        {checked && completeStyle && !bare && (
          <img
            style={{ position: 'absolute', zIndex: 100, maxHeight: '100%', maxWidth: '100%' }}
            src={CROSS_SVG}
            onClick={openTile}
            alt="completed"
          />
        )}
        {info?.image && (
          <img
            className={`bg-img ${showTileTitle ? 'has-tile-title' : ''}`}
            style={{
              opacity: info.image.opacity + '%',
              maxWidth: 'calc(100% - 8px)',
              width: info.image.usePixel ? '200px' : 'auto',
              height: info.image.usePixel ? '200px' : 'auto',
              objectFit: 'contain',
              maxHeight: showTileTitle ? '78%' : 'calc(100% - 8px)',
              imageRendering: info.image.usePixel ? 'pixelated' : 'auto',
            }}
            src={info.image.usePixel ? getPixelUrl(info.image.url) : info.image.url}
            alt=""
          />
        )}
        <div
          onClick={openTile}
          onKeyDown={!bare ? handleTileKeyDown : undefined}
          role={!bare ? 'button' : undefined}
          tabIndex={!bare ? 0 : undefined}
          aria-label={!bare ? (info?.title ? `Open ${info.title}` : 'Open tile') : undefined}
          style={{
            ...sizeStyle,
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          className={`box-flex box-border ${br ? 'br' : ''} ${bb ? 'bb' : ''}`}
        >
          {showTileTitle && (
            <div className="tile-title-overlay" style={titleStyle} title={info.title}>
              {info.title}
            </div>
          )}
          {!bare && (
            <div className="tile-meta">
              {showTeamProgress && (
                <div className="tile-progress-badge">
                  {teamInfo.currPoints} / {info.points}
                </div>
              )}
              {privilage === 'admin' && (
                <div className="tile-progress-badge tile-admin-points">{info?.points}</div>
              )}
            </div>
          )}
        </div>
      </span>

      {showModal && (
        <Modal
          cord={cord}
          change={change}
          privilage={privilage}
          info={info}
          teamInfo={teamInfo}
          show
          handleClose={() => setShowModal(false)}
          br={br}
          bb={bb}
        />
      )}
    </>
  );
}

function getTileTitleFontSize(title = '') {
  const length = title.trim().length;
  const size = Math.max(0.72, Math.min(1, 1 - length * 0.007));
  return `${size.toFixed(2)}rem`;
}

function getPixelUrl(url) {
  if (!url) return url;
  const match = url.match(/\/thumb\/([^/]+)_detail\.png\//);
  if (match) {
    const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    return `https://oldschool.runescape.wiki/images/${name}.png`;
  }
  return url;
}
