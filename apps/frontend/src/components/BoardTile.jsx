import { useState } from 'react';
import './BoardTile.css';
import Modal from './BootStrap/TileModal';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getStoredBool } from '../utils/utils';

const CROSS_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='red' stroke-width='3'/><path d='M0 0 L100 100 ' stroke='red' stroke-width='3'/></svg>";

export default function BoardTile({ cord, change, info, teamInfo, dem, br, bb, privilage, bare }) {
  const [showModal, setShowModal] = useState(false);

  const checked = teamInfo?.checked;
  const completeStyle = getStoredBool('completeStyle');
  const showPoints = getStoredBool('showPoints');
  const showTitleTile = getStoredBool('showTitleTile');

  const sizeStyle = dem ? { height: dem, width: dem } : {};

  let bgHeight = null;
  if (teamInfo) {
    if (checked) {
      bgHeight = '100%';
    } else if (info?.points > 0) {
      bgHeight = Math.round(teamInfo.currPoints / info.points * 100) + '%';
    }
  }

  return (
    <>
      <OverlayTrigger
        placement="top"
        overlay={
          info?.title
            ? <Tooltip style={{ position: 'fixed' }}>{info.title}</Tooltip>
            : <div />
        }
      >
        <span
          className={`tile-wrapper ${!completeStyle && checked ? 'green-bg' : ''}`}
          style={{ '--bgHeight': bgHeight }}
        >
          {checked && completeStyle && !bare &&
            <img
              style={{ position: 'absolute', zIndex: 100, maxHeight: '100%', maxWidth: '100%' }}
              src={CROSS_SVG}
              onClick={() => setShowModal(true)}
              alt="completed"
            />
          }
          {info?.image &&
            <img
              className='bg-img'
              style={{
                opacity: info.image.opacity + '%',
                maxWidth: 'calc(100% - 8px)',
                width: info.image.usePixel ? '200px' : 'auto',
                height: info.image.usePixel ? '200px' : 'auto',
                objectFit: 'contain',
                maxHeight: !showTitleTile ? '80%' : 'calc(100% - 8px)',
                imageRendering: info.image.usePixel ? 'pixelated' : 'auto',
              }}
              src={info.image.usePixel ? getPixelUrl(info.image.url) : info.image.url}
              alt=""
            />
          }
          <div
            onClick={() => setShowModal(true)}
            style={{ ...sizeStyle, flexDirection: 'column', justifyContent: showTitleTile ? 'flex-end' : 'space-between', overflow: 'hidden' }}
            className={`box-flex box-border ${br ? 'br' : ''} ${bb ? 'bb' : ''}`}
          >
            {!bare && !showTitleTile &&
              <div style={{ height: '20%', textAlign: 'center', fontFamily: 'osrsFont' }}>
                {info?.title}
              </div>
            }
            {!bare &&
              <div style={{ width: '100%' }}>
                {info && teamInfo && info.points > 0 && !showPoints &&
                  <div style={{ justifyContent: 'flex-end', display: 'flex', height: '100%', alignItems: 'flex-end' }}>
                    {teamInfo.currPoints} / {info.points}
                  </div>
                }
                {privilage === 'admin' &&
                  <div style={{ justifyContent: 'flex-end', display: 'flex', height: '100%', alignItems: 'flex-end' }}>
                    {info?.points}
                  </div>
                }
              </div>
            }
          </div>
        </span>
      </OverlayTrigger>

      {showModal &&
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
      }
    </>
  );
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
