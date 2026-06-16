import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import EditableInput from '../EditableInput';
import { ModalButton } from '../ModalShell';
import type { ImageSuggestion, TileModalState } from './types';

const tileImages = import.meta.glob<string>('../../../assets/*.png', {
  eager: true,
  import: 'default',
});

interface TileImagePickerProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleCustomImage: (e: ChangeEvent<HTMLInputElement>) => void;
  inputState: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, target?: string) => void;
  isGenericBoard: boolean;
  searchInputTitle: string;
  searchProviderName: string;
  setImage: (image: string | ImageSuggestion, skipUrlBuild?: boolean) => void;
  state: TileModalState;
}

export default function TileImagePicker({
  fileInputRef,
  handleCustomImage,
  inputState,
  isGenericBoard,
  searchInputTitle,
  searchProviderName,
  setImage,
  state,
}: TileImagePickerProps) {
  return (
    <>
      {!isGenericBoard &&
        Object.keys(tileImages).map((image, i) => {
          const imageName =
            image
              .split('/')
              .pop()
              ?.replace(/\.png$/i, '') || image;
          return (
            <img
              key={i}
              title={imageName}
              src={tileImages[image]}
              onClick={() => setImage(imageName)}
              alt={imageName}
            />
          );
        })}
      {!isGenericBoard && <hr />}
      <div className="alert">
        {isGenericBoard
          ? 'Search Wikimedia Commons for a freely licensed image, or upload a custom image.'
          : "Click any image above to set it or type an item's name below as it would appear on the wiki."}
        {!isGenericBoard && (
          <>
            <br />
            Examples: Coins, Infernal cape, Bucket of milk, Beaver, Plank
          </>
        )}
      </div>
      <div style={{ display: 'flex' }}>
        <EditableInput
          value={state.wikiSearch}
          stateKey="wikiSearch"
          change={inputState}
          title={searchInputTitle}
        />
      </div>
      {state.loading && (
        <div className="tm-spinner" role="status" aria-live="polite">
          <div className="tm-spinner-ring" />
          <span className="tm-visually-hidden">Loading...</span>
        </div>
      )}
      {state.wikiSearchError && (
        <div className="alert" role="alert">
          Could not reach {searchProviderName}. Check your connection and try again.
        </div>
      )}
      {state.triedToSearch && !state.wikiSearchError && state.suggestions?.length === 0 && (
        <div className="alert" role="alert">
          No results found, try searching something else
        </div>
      )}
      {state.suggestions?.length > 0 && (
        <ul className={`tm-suggestion-list${isGenericBoard ? ' tm-suggestion-list--generic' : ''}`}>
          {state.suggestions.map((item, i) => (
            <li
              key={i}
              className="tm-suggestion-item"
              role="button"
              tabIndex={0}
              onClick={() => setImage(item)}
              onKeyDown={(e: ReactKeyboardEvent<HTMLLIElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setImage(item);
                }
              }}
            >
              <div className="tm-suggestion-content">
                <img
                  src={item.thumbnail?.url}
                  className="tm-suggestion-thumb"
                  alt={item.title}
                />
                <span className="tm-suggestion-text">
                  <span>{item.title}</span>
                  {(item.attribution || item.license || item.sourceName) && (
                    <small>
                      {[item.attribution, item.license, item.sourceName]
                        .filter(Boolean)
                        .join(' / ')}
                    </small>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <br />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleCustomImage}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <ModalButton
        variant="primary"
        style={{ marginTop: '10px' }}
        onClick={() => fileInputRef.current?.click()}
      >
        Custom image or gif
      </ModalButton>
    </>
  );
}
