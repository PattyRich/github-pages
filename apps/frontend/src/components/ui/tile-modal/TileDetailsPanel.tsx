import type { ChangeEvent, RefObject } from 'react';
import EditableInput from '../EditableInput';
import { CheckboxField } from '../FormControls';
import ImageLightbox from '../ImageLightbox';
import { ModalButton } from '../ModalShell';
import ProofImageGrid from '../ProofImageGrid';
import { detectURLs, isAnimatedTileImage } from './imageUtils';
import type { TileModalState } from './types';

interface TileDetailsPanelProps {
  closeLightbox: () => void;
  cycleImage: (direction: -1 | 1) => void;
  handleProofImage: (e: ChangeEvent<HTMLInputElement>) => void;
  inputState: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, target?: string) => void;
  isAdmin: boolean;
  isGeneral: boolean;
  isGenericBoard: boolean;
  openLightbox: (index: number) => void;
  proofFileInputRef: RefObject<HTMLInputElement | null>;
  removeProofImage: (index: number) => void;
  setTileState: (stateChange: Partial<TileModalState>) => void;
  showColumnBonus?: boolean;
  showRowBonus?: boolean;
  state: TileModalState;
  toggleCheck: () => void;
  toggleImageSelect: () => void;
  toggleUsePixel: () => void;
}

export default function TileDetailsPanel({
  closeLightbox,
  cycleImage,
  handleProofImage,
  inputState,
  isAdmin,
  isGeneral,
  isGenericBoard,
  openLightbox,
  proofFileInputRef,
  removeProofImage,
  setTileState,
  showColumnBonus,
  showRowBonus,
  state,
  toggleCheck,
  toggleImageSelect,
  toggleUsePixel,
}: TileDetailsPanelProps) {
  return (
    <>
      <EditableInput
        value={state.description}
        textArea
        autoGrow
        autoGrowMaxHeight={220}
        stateKey="description"
        change={inputState}
        title="Description"
        disabled={isGeneral}
      />
      {showRowBonus && (
        <EditableInput
          value={state.rowBingo}
          stateKey="rowBingo"
          change={inputState}
          title="Row Bonus"
          disabled={isGeneral}
        />
      )}
      {showColumnBonus && (
        <EditableInput
          value={state.colBingo}
          stateKey="colBingo"
          change={inputState}
          title="Column Bonus"
          disabled={isGeneral}
        />
      )}

      {isAdmin && (
        <>
          {state.image ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ModalButton
                variant="primary"
                style={{ marginBottom: '10px' }}
                onClick={() => setTileState({ image: null })}
              >
                Remove Tile Background Image
              </ModalButton>
              <img
                src={state.image.url}
                style={{
                  maxWidth: '80px',
                  maxHeight: '80px',
                  margin: '10px 0px 20px 10px',
                  opacity: getTileImageOpacity(state.image),
                  objectFit: 'contain',
                }}
                alt="Tile background"
              />
            </div>
          ) : (
            <ModalButton
              variant="primary"
              style={{ marginBottom: '10px' }}
              onClick={toggleImageSelect}
            >
              Set Tile Background Image
            </ModalButton>
          )}
          {state.image && (
            <>
              {state.image.sourceName && (
                <div className="tm-image-credit">
                  <span>Source: </span>
                  {state.image.sourceUrl ? (
                    <a href={state.image.sourceUrl} target="_blank" rel="noreferrer">
                      {state.image.sourceName}
                    </a>
                  ) : (
                    state.image.sourceName
                  )}
                  {state.image.attribution && <span> by {state.image.attribution}</span>}
                  {state.image.license && (
                    <span>
                      {' '}
                      (
                      {state.image.licenseUrl ? (
                        <a href={state.image.licenseUrl} target="_blank" rel="noreferrer">
                          {state.image.license}
                        </a>
                      ) : (
                        state.image.license
                      )}
                      )
                    </span>
                  )}
                </div>
              )}
              {!isGenericBoard && !isAnimatedTileImage(state.image) && (
                <CheckboxField
                  className="tm-check tm-check--image"
                  inputClassName="tm-check-input"
                  labelClassName="tm-check-label"
                  id="pixelImageCheckbox"
                  label="Use pixel image?"
                  checked={state.image.usePixel}
                  onChange={toggleUsePixel}
                />
              )}
            </>
          )}
        </>
      )}

      <div className="tm-points-group" style={{ width: '100%', maxWidth: '320px' }}>
        <span className="tm-input-addon">Points</span>
        <input
          className="tm-points-input"
          type="text"
          aria-label="Current Points"
          value={state.currPoints}
          disabled={!isGeneral || state.checked}
          onChange={(e) => inputState(e, 'currPoints')}
        />
        <span className="tm-input-addon">/</span>
        <input
          className="tm-points-input"
          type="text"
          aria-label="Total Points"
          value={state.points}
          disabled={!isAdmin}
          onChange={(e) => inputState(e, 'points')}
        />
      </div>

      {isGeneral && (
        <>
          <div className="flex">
            <EditableInput
              placeholder="Paste imgur or any link"
              value={state.proof}
              textArea
              stateKey="proof"
              change={inputState}
              title="Proof"
            />
            <div className="flex" style={{ flexWrap: 'wrap' }}>
              {detectURLs(state.proof).map((url, i) => (
                <div key={url} style={{ margin: '5px' }}>
                  <a target="_blank" href={url} rel="noreferrer">
                    Link-{i}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <ProofImageGrid
            images={state.proofImages || []}
            inputRef={proofFileInputRef}
            onUpload={handleProofImage}
            onOpen={openLightbox}
            onRemove={removeProofImage}
          />

          <ImageLightbox
            images={state.proofImages || []}
            index={state.lightboxIndex}
            onClose={closeLightbox}
            onCycle={cycleImage}
          />

          <CheckboxField
            className="tm-check tm-check--completed"
            inputClassName="tm-check-input"
            labelClassName="tm-check-label"
            id="tileCompleted"
            label="Completed?"
            checked={state.checked}
            onChange={toggleCheck}
          />
        </>
      )}
    </>
  );
}

function getTileImageOpacity(image?: TileModalState['image']) {
  return `${image?.opacity ?? 100}%`;
}
