import { useEffect, useRef, useState } from 'react';
import EditableInput from './EditableInput';
import { CheckboxField } from './FormControls';
import ImageLightbox from './ImageLightbox';
import { ModalButton, ModalShell } from './ModalShell';
import ProofImageGrid from './ProofImageGrid';
import './TileModal.css';

const NUM_INPUTS = ['points', 'currPoints', 'rowBingo', 'colBingo'];
const tileImages = import.meta.glob('../../assets/*.png', { eager: true, import: 'default' });

function TileModal({ cord, change, handleClose, info, teamInfo, privilage, show, br, bb }) {
  const [state, setState] = useState(() => ({
    wikiSearch: '',
    ...info,
    ...teamInfo,
    proofImages: teamInfo?.proofImages || [],
    proofImagesChanged: false,
    suggestions: [],
    storedSuggestions: {},
    lightboxIndex: null,
  }));
  const stateRef = useRef(state);
  const badTitlesRef = useRef([]);
  const listOfImagesRef = useRef({});
  const fileInputRef = useRef(null);
  const proofFileInputRef = useRef(null);
  const debouncedSetCurrSuggestionsRef = useRef(null);

  function setTileState(stateChange) {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        ...stateChange,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }

  function updateTileState(updater) {
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

  function setSuggestions(curr, storedSuggestions = stateRef.current.storedSuggestions) {
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
    setTileState({ loading: true, triedToSearch: false });

    const url = `https://oldschool.runescape.wiki/rest.php/v1/search/title?q=${encodeURIComponent(searchValue)}&limit=5`;
    fetch(url)
      .then((res) => res.json())
      .then(async (data) => {
        const fetchPromises = (data.pages || []).map(async (item) => {
          if (!item.thumbnail || badTitlesRef.current.includes(item.title)) return null;
          if (stateRef.current.storedSuggestions[item.title]) return item;
          const imgUrl = getImageUrl(item.title);
          const response = await fetch(imgUrl);
          if (response.status === 200) {
            item.url = imgUrl;
            return item;
          }
          badTitlesRef.current.push(item.title);
          return null;
        });

        const results = (await Promise.all(fetchPromises)).filter(Boolean);
        const storedSuggestions = { ...stateRef.current.storedSuggestions };
        results.forEach((item) => {
          storedSuggestions[item.title] = item;
        });
        setTileState({ storedSuggestions });
        setSuggestions(results, storedSuggestions);
      });
  }

  if (!debouncedSetCurrSuggestionsRef.current) {
    debouncedSetCurrSuggestionsRef.current = debounce(setCurrSuggestions, 600);
  }

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (stateRef.current.lightboxIndex === null) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Escape') {
        e.stopPropagation();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        setState((currentState) => {
          const len = (currentState.proofImages || []).length;
          if (!len) return currentState;
          const nextState = {
            ...currentState,
            lightboxIndex: (currentState.lightboxIndex + direction + len) % len,
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

  function handleCustomImage(e) {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target.result, true);
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid PNG or JPEG file');
    }
  }

  function inputState(e, target) {
    let value = e.target.value;
    if (NUM_INPUTS.includes(target)) {
      if (isNaN(value)) value = 0;
      if (target === 'currPoints' && Number(value) > Number(stateRef.current.points)) {
        value = stateRef.current.points;
      }
    }
    if (target === 'wikiSearch') {
      value = nameFilter(value);
      debouncedSetCurrSuggestionsRef.current(value);
    }
    setTileState({ [target]: value });
  }

  function toggleImageSelect() {
    listOfImagesRef.current = tileImages;
    setTileState({ chooseImage: true });
  }

  function setImage(image, skipUrlBuild = false) {
    const url = skipUrlBuild ? image : getImageUrl(image);
    setTileState({ image: { opacity: '100', url, usePixel: false }, chooseImage: false });
  }

  function toggleUsePixel() {
    updateTileState((currentState) => ({
      image: { ...currentState.image, usePixel: !currentState.image.usePixel },
    }));
  }

  function changeOpacity(e) {
    let val = Number(e.target.value);
    if (isNaN(val)) val = 100;
    val = Math.min(100, Math.max(1, val));
    updateTileState((currentState) => ({ image: { ...currentState.image, opacity: val } }));
  }

  function toggleCheck() {
    updateTileState((currentState) => ({
      checked: !currentState.checked,
      currPoints: currentState.points,
    }));
  }

  function handleSave() {
    let stateToSave = { ...stateRef.current };
    if (privilage === 'admin') {
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
    change(cord[0], cord[1], stateToSave);
    handleClose();
  }

  function handleProofImage(e) {
    const MAX = 10;
    Array.from(e.target.files).forEach((file) => {
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        updateTileState((currentState) => {
          const current = currentState.proofImages || [];
          if (current.length >= MAX) return null;
          return { proofImages: [...current, event.target.result], proofImagesChanged: true };
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removeProofImage(index) {
    updateTileState((currentState) => ({
      proofImages: currentState.proofImages.filter((_, i) => i !== index),
      lightboxIndex: null,
      proofImagesChanged: true,
    }));
  }

  function openLightbox(index) {
    setTileState({ lightboxIndex: index });
  }

  function closeLightbox() {
    setTileState({ lightboxIndex: null });
  }

  function cycleImage(direction) {
    const len = (stateRef.current.proofImages || []).length;
    if (!len) return;
    updateTileState((currentState) => ({
      lightboxIndex: (currentState.lightboxIndex + direction + len) % len,
    }));
  }

  const isAdmin = privilage === 'admin';
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
          {state.triedToSearch && state.suggestions?.length === 0 && (
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
                  onKeyDown={(e) => {
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
            onClick={() => fileInputRef.current.click()}
          >
            Custom image
          </ModalButton>
        </>
      )}
    </ModalShell>
  );
}

export default TileModal;

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

function nameFilter(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function detectURLs(message) {
  if (!message?.length) return [];
  const res = message.match(/(((https?:\/\/)|(www\.))[^\s]+)/g);
  return res || [];
}

function getImageUrl(image) {
  image = image.split('/').pop();
  if (image.endsWith('png')) image = image.slice(0, -4);
  image = decodeURI(image).replaceAll(' ', '_');
  image = image.charAt(0).toUpperCase() + image.slice(1);
  return `https://oldschool.runescape.wiki/images/thumb/${encodeURIComponent(image)}_detail.png/180px-${encodeURIComponent(image)}_detail.png`;
}
