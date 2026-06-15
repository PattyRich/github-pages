import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import EditableInput from './EditableInput';
import { CheckboxField } from './FormControls';
import ImageLightbox from './ImageLightbox';
import { ModalButton, ModalShell } from './ModalShell';
import ProofImageGrid from './ProofImageGrid';
import { debounce } from '../../utils/utils';
import './TileModal.css';

const NUM_INPUTS = ['points', 'currPoints', 'rowBingo', 'colBingo'];
const tileImages = import.meta.glob<string>('../../assets/*.png', {
  eager: true,
  import: 'default',
});

export interface TileImage {
  opacity: number | string;
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

interface WikiSuggestion {
  thumbnail?: {
    url?: string;
  };
  title: string;
  url: string;
}

interface WikiSearchResponse {
  pages?: WikiSuggestion[];
}

export interface TileModalState extends TileInfo, TeamTileInfo {
  chooseImage?: boolean;
  lightboxIndex: number | null;
  loading?: boolean;
  proofImages: string[];
  proofImagesChanged: boolean;
  storedSuggestions: Record<string, WikiSuggestion>;
  suggestions: WikiSuggestion[];
  triedToSearch?: boolean;
  wikiSearch: string;
  wikiSearchError?: boolean;
}

interface TileModalProps {
  bb?: boolean;
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
    curr: WikiSuggestion[] | null,
    storedSuggestions = stateRef.current.storedSuggestions
  ) {
    if (!curr) {
      setTileState({ suggestions: [] });
      return;
    }
    const data = curr
      .filter((item) => storedSuggestions[item.title])
      .map((item) => storedSuggestions[item.title]);
    setTileState({ suggestions: data, triedToSearch: true, loading: false });
  }

  function setCurrSuggestions(searchValue = stateRef.current.wikiSearch) {
    setSuggestions(null);
    if (!searchValue.length) return;

    const requestId = ++wikiSearchSeqRef.current;
    setTileState({ loading: true, triedToSearch: false, wikiSearchError: false });

    const url = `https://oldschool.runescape.wiki/rest.php/v1/search/title?q=${encodeURIComponent(searchValue)}&limit=5`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Wiki search failed (${res.status})`);
        }
        return res.json() as Promise<WikiSearchResponse>;
      })
      .then(async (data) => {
        if (requestId !== wikiSearchSeqRef.current) return;

        const fetchPromises = (data.pages || []).map(async (item) => {
          if (!item.thumbnail || badTitlesRef.current.includes(item.title)) return null;
          if (stateRef.current.storedSuggestions[item.title]) return item;
          const imgUrl = getImageUrl(item.title);
          try {
            const response = await fetch(imgUrl);
            if (response.status === 200) {
              item.url = imgUrl;
              return item;
            }
            badTitlesRef.current.push(item.title);
          } catch {
            badTitlesRef.current.push(item.title);
          }
          return null;
        });

        const results = (await Promise.all(fetchPromises)).filter((item): item is WikiSuggestion =>
          Boolean(item)
        );
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
      value = nameFilter(String(value));
      debouncedSetCurrSuggestionsRef.current?.(value);
    }
    setTileState({ [target]: value } as Partial<TileModalState>);
  }

  function toggleImageSelect() {
    listOfImagesRef.current = tileImages;
    setTileState({ chooseImage: true });
  }

  function setImage(image: string, skipUrlBuild = false) {
    isDirtyRef.current = true;
    const url = skipUrlBuild ? image : getImageUrl(image);
    setTileState({ image: { opacity: '100', url, usePixel: false }, chooseImage: false });
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
                  <CheckboxField
                    className="tm-check tm-check--image"
                    inputClassName="tm-check-input"
                    labelClassName="tm-check-label"
                    id="pixelImageCheckbox"
                    label="Use pixel image?"
                    checked={state.image.usePixel}
                    onChange={toggleUsePixel}
                  />
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
          {Object.keys(listOfImagesRef.current).map((image, i) => {
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
          <hr />
          <div className="alert">
            Click any image above to set it or type an item's name below as it would appear on the
            wiki.
            <br />
            Examples: Coins, Infernal cape, Bucket of milk, Beaver, Plank
          </div>
          <div style={{ display: 'flex' }}>
            <EditableInput
              value={state.wikiSearch}
              stateKey="wikiSearch"
              change={inputState}
              title="Item Search"
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
              Could not reach the OSRS wiki. Check your connection and try again.
            </div>
          )}
          {state.triedToSearch && !state.wikiSearchError && state.suggestions?.length === 0 && (
            <div className="alert" role="alert">
              No results found, try searching something else
            </div>
          )}
          {state.suggestions?.length > 0 && (
            <ul className="tm-suggestion-list">
              {state.suggestions.map((item, i) => (
                <li
                  key={i}
                  className="tm-suggestion-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => setImage(item.url, true)}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLLIElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setImage(item.url, true);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src={item.thumbnail?.url}
                      style={{ maxWidth: '40px', maxHeight: '40px', paddingRight: '10px' }}
                      alt={item.title}
                    />
                    {item.title}
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
