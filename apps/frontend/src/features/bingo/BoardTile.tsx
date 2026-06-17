import { useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import './BoardTile.css';
import Modal from '../../components/ui/TileModal';
import type { TeamTileInfo, TileInfo, TileModalState } from '../../components/ui/tile-modal/types';
import { getStoredBool } from '../../utils/utils';
import { DEFAULT_BOARD_TYPE, type BoardType } from '../../types';

const CROSS_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='red' stroke-width='3'/><path d='M0 0 L100 100 ' stroke='red' stroke-width='3'/></svg>";

type TileCoord = [number, number];

interface BoardTileProps {
  bare?: boolean;
  bb?: boolean;
  boardType?: BoardType;
  br?: boolean;
  change?: (row: number, col: number, info: Partial<TileModalState>) => Promise<void> | void;
  cord?: TileCoord;
  dem?: number | string;
  info?: TileInfo | null;
  onOpen?: (cord?: TileCoord) => void;
  privilege?: string;
  teamInfo?: TeamTileInfo | null;
}

export default function BoardTile({
  cord,
  change,
  info,
  onOpen,
  teamInfo,
  dem,
  br,
  bb,
  privilege,
  bare,
  boardType = DEFAULT_BOARD_TYPE,
}: BoardTileProps) {
  const [showModal, setShowModal] = useState(false);

  const checked = teamInfo?.checked;
  const completeStyle = getStoredBool('completeStyle');
  const showPoints = getStoredBool('showPoints');
  const showTitleTile = getStoredBool('showTitleTile');
  const showTileTitle = !bare && !showTitleTile && info?.title;
  const showTitlePopup = !bare && info?.title;
  const showTeamProgress = info && teamInfo && Number(info.points) > 0 && !showPoints;
  const usePixelImage =
    boardType === 'osrs' && info?.image?.usePixel && !isAnimatedTileImage(info.image);

  const sizeStyle: CSSProperties = dem ? { height: dem, width: dem } : {};
  const titleStyle: (CSSProperties & Record<string, string>) | undefined = showTileTitle
    ? { '--tile-title-font-size': getTileTitleFontSize(info.title) }
    : undefined;

  let bgHeight: string | null = null;
  if (teamInfo) {
    if (checked) {
      bgHeight = '100%';
    } else if (Number(info?.points) > 0) {
      bgHeight = Math.round((Number(teamInfo.currPoints) / Number(info?.points)) * 100) + '%';
    }
  }

  function openTile() {
    onOpen?.(cord);
    setShowModal(true);
  }

  function handleTileKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openTile();
    }
  }

  return (
    <>
      <span
        className={`tile-wrapper ${!completeStyle && checked ? 'green-bg' : ''}`}
        style={{ '--bgHeight': bgHeight } as CSSProperties}
      >
        {showTitlePopup && (
          <span className="tile-title-popover" data-title={info.title} aria-hidden="true" />
        )}
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
              opacity: getTileImageOpacity(info.image),
              maxWidth: 'calc(90% - 16px)',
              width: usePixelImage ? '200px' : 'auto',
              height: usePixelImage ? '200px' : 'auto',
              objectFit: 'contain',
              maxHeight: showTileTitle ? '78%' : 'calc(100% - 8px)',
              imageRendering: usePixelImage ? 'pixelated' : 'auto',
            }}
            src={usePixelImage ? getPixelUrl(info.image.url) : info.image.url}
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
            <div className="tile-title-overlay" style={titleStyle}>
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
              {privilege === 'admin' && (
                <div className="tile-progress-badge tile-admin-points">{info?.points}</div>
              )}
            </div>
          )}
        </div>
      </span>

      {showModal && (
        <Modal
          cord={cord ?? [0, 0]}
          change={change ?? noopChange}
          privilege={privilege}
          info={info ?? undefined}
          teamInfo={teamInfo}
          show
          handleClose={() => setShowModal(false)}
          br={br}
          bb={bb}
          boardType={boardType}
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

function getTileImageOpacity(image?: TileInfo['image']) {
  return `${image?.opacity ?? 100}%`;
}

function getPixelUrl(url?: string) {
  if (!url) return url;
  const match = url.match(/\/thumb\/([^/]+)_detail\.png\//);
  if (match) {
    const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    return `https://oldschool.runescape.wiki/images/${name}.png`;
  }
  return url;
}

function isAnimatedTileImage(image?: TileInfo['image']) {
  const url = image?.url || '';
  return Boolean(
    image?.animated || /^data:image\/gif[;,]/i.test(url) || /\.gif(?:[?#]|$)/i.test(url)
  );
}

const noopChange: NonNullable<BoardTileProps['change']> = () => undefined;
