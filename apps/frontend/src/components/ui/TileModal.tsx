import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import EditableInput from './EditableInput';
import { CheckboxField } from './FormControls';
import ImageLightbox from './ImageLightbox';
import { ModalButton, ModalShell } from './ModalShell';
import ProofImageGrid from './ProofImageGrid';
import { debounce } from '../../utils/utils';
import { DEFAULT_BOARD_TYPE, type BoardType } from '../../types';
import './TileModal.css';

const NUM_INPUTS = ['points', 'currPoints', 'rowBingo', 'colBingo'];
const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
const tileImages = import.meta.glob<string>('../../assets/*.png', {
  eager: true,
  import: 'default',
});

export interface TileImage {
  attribution?: string;
  license?: string;
  licenseUrl?: string;
  opacity: number | string;
  sourceName?: string;
  sourceUrl?: string;
  url: string;
  usePixel?: boolean;
}

export interface TileInfo {
  colBingo?: number | string;
  description?: string;
  image?: TileImage | null;
  points?: number | string;
  rowBingo?: number | string;
  title?: string;
}

export interface TeamTileInfo {
  checked?: boolean;
  currPoints?: number | string;
  proof?: string;
  proofImages?: string[];
}

interface ImageSuggestion {
  attribution?: string;
  license?: string;
  licenseUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  thumbnail?: {
    url?: string;
  };
  title: string;
  url: string;
}

interface OsrsSearchResponse {
  pages?: ImageSuggestion[];
}

interface CommonsSearchResponse {
  query?: {
    pages?: Record<string, CommonsPage>;
  };
}

interface CommonsPage {
  imageinfo?: CommonsImageInfo[];
  title: string;
}

interface CommonsImageInfo {
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string }>;
  thumburl?: string;
  url?: string;
}

export interface TileModalState extends TileInfo, TeamTileInfo {
  chooseImage?: boolean;
  lightboxIndex: number | null;
  loading?: boolean;
  proofImages: string[];
  proofImagesChanged: boolean;
  storedSuggestions: Record<string, ImageSuggestion>;
  suggestions: ImageSuggestion[];
  triedToSearch?: boolean;
  wikiSearch: string;
  wikiSearchError?: boolean;
}

interface TileModalProps {
  bb?: boolean;
  boardType?: BoardType;
  br?: boolean;
  change: (row: number, col: number, info: Partial<TileModalState>) => Promise<void> | void;
  cord: [number, number];
  handleClose: () => void;
  info?: TileInfo;
  privilege?: string;
  show?: boolean;
  teamInfo?: TeamTileInfo | null;
}

function TileModal({
  cord,
  change,
  handleClose,
  info = {},
  teamInfo,
  privilege,
  show,
  br,
  bb,
  boardType = DEFAULT_BOARD_TYPE,
}: TileModalProps) {
  const [state, setState] = useState<TileModalState>(() => ({
    wikiSearch: '',
    ...info,
    ...teamInfo,
    proofImages: teamInfo?.proofImages || [],
    proofImagesChanged: false,
    suggestions: [],
    storedSuggestions: {},
    lightboxIndex: null,
  }));
  const stateRef = useRef<TileModalState>(state);
  const isDirtyRef = useRef(false);
  const badTitlesRef = useRef<string[]>([]);
  const listOfImagesRef = useRef<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedSetCurrSuggestionsRef = useRef<((searchValue?: string) => void) | null>(null);
  const wikiSearchSeqRef = useRef(0);

  function setTileState(stateChange: Partial<TileModalState>) {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        ...stateChange,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }

  function updateTileState(
    updater: (currentState: TileModalState) => Partial<TileModalState> | null | undefined
  ) {
    setState((currentState) => {
      const stateChange = updater(currentState);
      if (!stateChange) {
        return currentState;
      }
      const nextState = {
        ...currentState,
        ...stateChange,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }

  function setSuggestions(
    curr: ImageSuggestion[] | null,
    storedSuggestions = stateRef.current.storedSuggestions
  ) {
    if (!curr) {
      setTileState({ suggestions: [] });
      return;
    }
    const data = curr.map((item) => storedSuggestions[item.title] || item);
    setTileState({ suggestions: data, triedToSearch: true, loading: false });
  }

  function setCurrSuggestions(searchValue = stateRef.current.wikiSearch) {
    setSuggestions(null);
    if (!searchValue.length) return;

    const requestId = ++wikiSearchSeqRef.current;
    setTileState({ loading: true, triedToSearch: false, wikiSearchError: false });

    const searchPromise =
      boardType === 'generic'
        ? fetchCommonsSuggestions(searchValue)
        : fetchOsrsSuggestions(
            searchValue,
            badTitlesRef.current,
            stateRef.current.storedSuggestions
          );

    searchPromise
      .then((results) => {
        if (requestId !== wikiSearchSeqRef.current) return;

        const storedSuggestions = { ...stateRef.current.storedSuggestions };
        results.forEach((item) => {
          storedSuggestions[item.title] = item;
        });
        setTileState({ storedSuggestions });
        setSuggestions(results, storedSuggestions);
      })
      .catch(() => {
        if (requestId !== wikiSearchSeqRef.current) return;
        setTileState({
          loading: false,
          triedToSearch: true,
          suggestions: [],
          wikiSearchError: true,
        });
      });
  }

  if (!debouncedSetCurrSuggestionsRef.current) {
    debouncedSetCurrSuggestionsRef.current = debounce(setCurrSuggestions, 600);
  }

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!isDirtyRef.current) {
      setTileState({
        ...info,
        ...teamInfo,
        proofImages: teamInfo?.proofImages || [],
      });
    }
  }, [info, teamInfo]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (stateRef.current.lightboxIndex === null) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Escape') {
        e.stopPropagation();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        setState((currentState) => {
          const len = (currentState.proofImages || []).length;
          if (!len) return currentState;
          const currentIndex = currentState.lightboxIndex ?? 0;
          const nextState = {
            ...currentState,
            lightboxIndex: (currentIndex + direction + len) % len,
          };
          stateRef.current = nextState;
          return nextState;
        });
      } else if (e.key === 'Escape') {
        setState((currentState) => {
          const nextState = {
            ...currentState,
            lightboxIndex: null,
          };
          stateRef.current = nextState;
          return nextState;
        });
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  function handleCustomImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') setImage(result, true);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid PNG or JPEG file');
    }
  }

  function inputState(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, target?: string) {
    if (!target) return;
    isDirtyRef.current = true;
    let value: number | string = e.target.value;
    if (NUM_INPUTS.includes(target)) {
      if (Number.isNaN(Number(value))) value = 0;
      if (target === 'currPoints' && Number(value) > Number(stateRef.current.points)) {
        value = stateRef.current.points ?? 0;
      }
    }
    if (target === 'wikiSearch') {
      value = boardType === 'osrs' ? nameFilter(String(value)) : String(value);
      debouncedSetCurrSuggestionsRef.current?.(value);
    }
    setTileState({ [target]: value } as Partial<TileModalState>);
  }

  function toggleImageSelect() {
    listOfImagesRef.current = boardType === 'osrs' ? tileImages : {};
    setTileState({ chooseImage: true });
  }

  function setImage(image: string | ImageSuggestion, skipUrlBuild = false) {
    isDirtyRef.current = true;
    const nextImage =
      typeof image === 'string'
        ? {
            opacity: '100',
            url: skipUrlBuild ? image : getImageUrl(image),
            usePixel: false,
          }
        : {
            attribution: image.attribution,
            license: image.license,
            licenseUrl: image.licenseUrl,
            opacity: '100',
            sourceName: image.sourceName,
            sourceUrl: image.sourceUrl,
            url: image.url,
            usePixel: false,
          };
    setTileState({ image: nextImage, chooseImage: false });
  }

  function toggleUsePixel() {
    isDirtyRef.current = true;
    updateTileState((currentState) => {
      if (!currentState.image) return null;
      return {
        image: { ...currentState.image, usePixel: !currentState.image.usePixel },
      };
    });
  }

  function changeOpacity(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    isDirtyRef.current = true;
    let val = Number(e.target.value);
    if (isNaN(val)) val = 100;
    val = Math.min(100, Math.max(1, val));
    updateTileState((currentState) => {
      if (!currentState.image) return null;
      return { image: { ...currentState.image, opacity: val } };
    });
  }

  function toggleCheck() {
    isDirtyRef.current = true;
    updateTileState((currentState) => ({
      checked: !currentState.checked,
      currPoints: currentState.points,
    }));
  }

  async function handleSave() {
    let stateToSave: Partial<TileModalState> = { ...stateRef.current };
    if (privilege === 'admin') {
      delete stateToSave.checked;
      delete stateToSave.proof;
      delete stateToSave.currPoints;
    } else {
      stateToSave = {
        checked: stateToSave.checked,
        proof: stateToSave.proof,
        currPoints: stateToSave.currPoints,
      };
      if (stateRef.current.proofImagesChanged) {
        stateToSave.proofImages = stateRef.current.proofImages || [];
      }
    }
    await change(cord[0], cord[1], stateToSave);
    handleClose();
  }

  function handleProofImage(e: ChangeEvent<HTMLInputElement>) {
    const MAX = 10;
    Array.from(e.target.files || []).forEach((file) => {
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        updateTileState((currentState) => {
          const current = currentState.proofImages || [];
          if (current.length >= MAX) return null;
          const result = event.target?.result;
          if (typeof result !== 'string') return null;
          return { proofImages: [...current, result], proofImagesChanged: true };
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removeProofImage(index: number) {
    isDirtyRef.current = true;
    updateTileState((currentState) => ({
      proofImages: currentState.proofImages.filter((_, i) => i !== index),
      lightboxIndex: null,
      proofImagesChanged: true,
    }));
  }

  function openLightbox(index: number) {
    setTileState({ lightboxIndex: index });
  }

  function closeLightbox() {
    setTileState({ lightboxIndex: null });
  }

  function cycleImage(direction: -1 | 1) {
    const len = (stateRef.current.proofImages || []).length;
    if (!len) return;
    updateTileState((currentState) => ({
      lightboxIndex: ((currentState.lightboxIndex ?? 0) + direction + len) % len,
    }));
  }

  const isAdmin = privilege === 'admin';
  const isGeneral = !isAdmin;
  const isGenericBoard = boardType === 'generic';
  const searchInputTitle = isGenericBoard ? 'Image Search' : 'Item Search';
  const searchProviderName = isGenericBoard ? 'Wikimedia Commons' : 'the OSRS wiki';
  const showRowBonus = br && (isAdmin || Number(state.rowBingo) !== 0);
  const showColumnBonus = bb && (isAdmin || Number(state.colBingo) !== 0);

  const modalTitle = !state.chooseImage ? (
    isAdmin ? (
      <EditableInput value={state.title} stateKey="title" change={inputState} title="Title" />
    ) : (
      <h2>{state.title || 'Info'}</h2>
    )
  ) : (
    <h3>Set Tile Background Image</h3>
  );

  return (
    <ModalShell
      show={show}
      titleId="tile-modal-title"
      title={modalTitle}
      onClose={handleClose}
      maxWidth="800px"
      footer={
        <>
          <ModalButton variant="danger" onClick={handleClose}>
            Close
          </ModalButton>
          <ModalButton variant="success" onClick={handleSave}>
            Save
          </ModalButton>
        </>
      }
    >
      {!state.chooseImage ? (
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
                      opacity: state.image.opacity + '%',
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
                  <EditableInput
                    value={state.image.opacity}
                    change={changeOpacity}
                    title="Image Opacity (1-100)"
                  />
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
                  {!isGenericBoard && (
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
      ) : (
        <>
          {!isGenericBoard &&
            Object.keys(listOfImagesRef.current).map((image, i) => {
              const imageName =
                image
                  .split('/')
                  .pop()
                  ?.replace(/\.png$/i, '') || image;
              return (
                <img
                  key={i}
                  title={imageName}
                  src={listOfImagesRef.current[image]}
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
            accept=".png,.jpeg"
            onChange={handleCustomImage}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <ModalButton
            variant="primary"
            style={{ marginTop: '10px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            Custom image
          </ModalButton>
        </>
      )}
    </ModalShell>
  );
}

export default TileModal;

function nameFilter(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function detectURLs(message?: string) {
  if (!message?.length) return [];
  const res = message.match(/(((https?:\/\/)|(www\.))[^\s]+)/g);
  return res || [];
}

function getImageUrl(image: string) {
  image = image.split('/').pop() || image;
  if (image.endsWith('png')) image = image.slice(0, -4);
  image = decodeURI(image).replaceAll(' ', '_');
  image = image.charAt(0).toUpperCase() + image.slice(1);
  return `https://oldschool.runescape.wiki/images/thumb/${encodeURIComponent(image)}_detail.png/180px-${encodeURIComponent(image)}_detail.png`;
}

async function fetchOsrsSuggestions(
  searchValue: string,
  badTitles: string[],
  storedSuggestions: Record<string, ImageSuggestion>
): Promise<ImageSuggestion[]> {
  const url = `https://oldschool.runescape.wiki/rest.php/v1/search/title?q=${encodeURIComponent(searchValue)}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Wiki search failed (${res.status})`);
  }
  const data = (await res.json()) as OsrsSearchResponse;
  const fetchPromises = (data.pages || []).map(async (item) => {
    if (!item.thumbnail || badTitles.includes(item.title)) return null;
    if (storedSuggestions[item.title]) return storedSuggestions[item.title];
    const imgUrl = getImageUrl(item.title);
    try {
      const response = await fetch(imgUrl);
      if (response.status === 200) {
        return {
          ...item,
          sourceName: 'OSRS Wiki',
          sourceUrl: `https://oldschool.runescape.wiki/w/${encodeURIComponent(item.title.replaceAll(' ', '_'))}`,
          url: imgUrl,
        };
      }
      badTitles.push(item.title);
    } catch {
      badTitles.push(item.title);
    }
    return null;
  });

  return (await Promise.all(fetchPromises)).filter((item): item is ImageSuggestion =>
    Boolean(item)
  );
}

async function fetchCommonsSuggestions(searchValue: string): Promise<ImageSuggestion[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '6',
    gsrsearch: searchValue,
    iiprop: 'url|extmetadata',
    iiurlwidth: '480',
    origin: '*',
    prop: 'imageinfo',
  });
  const res = await fetch(`${COMMONS_API_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Commons search failed (${res.status})`);
  }
  const data = (await res.json()) as CommonsSearchResponse;
  return Object.values(data.query?.pages || {})
    .map(toCommonsSuggestion)
    .filter((item): item is ImageSuggestion => Boolean(item))
    .slice(0, 5);
}

function toCommonsSuggestion(page: CommonsPage): ImageSuggestion | null {
  const imageInfo = page.imageinfo?.[0];
  const imageUrl = imageInfo?.thumburl || imageInfo?.url;
  if (!imageUrl) return null;

  const extmetadata = imageInfo?.extmetadata || {};
  const title = metadataText(extmetadata, 'ObjectName') || cleanCommonsTitle(page.title);
  const attribution = metadataText(extmetadata, 'Artist') || metadataText(extmetadata, 'Credit');
  const license =
    metadataText(extmetadata, 'LicenseShortName') || metadataText(extmetadata, 'UsageTerms');
  const licenseUrl = metadataValue(extmetadata, 'LicenseUrl');

  return {
    attribution,
    license,
    licenseUrl,
    sourceName: 'Wikimedia Commons',
    sourceUrl: imageInfo?.descriptionurl,
    thumbnail: { url: imageUrl },
    title,
    url: imageUrl,
  };
}

function cleanCommonsTitle(title: string) {
  return title
    .replace(/^File:/, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replaceAll('_', ' ');
}

function metadataText(metadata: Record<string, { value?: string }>, key: string) {
  return stripHtml(metadataValue(metadata, key));
}

function metadataValue(metadata: Record<string, { value?: string }>, key: string) {
  return metadata[key]?.value || '';
}

function stripHtml(value: string) {
  if (!value) return '';
  const withoutTags = value.replace(/<[^>]*>/g, ' ');
  if (typeof document === 'undefined') return withoutTags.replace(/\s+/g, ' ').trim();
  const textarea = document.createElement('textarea');
  textarea.innerHTML = withoutTags;
  return textarea.value.replace(/\s+/g, ' ').trim();
}
