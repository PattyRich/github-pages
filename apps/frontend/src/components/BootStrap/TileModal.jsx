import { useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import EditableInput from './EditableInput';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';

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

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      aria-labelledby="tile-modal-title"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="tile-modal-title">
          {!state.chooseImage ? (
            isAdmin ? (
              <EditableInput value={state.title} stateKey="title" change={inputState} title="Title" />
            ) : (
              <h2>{state.title || 'Info'}</h2>
            )
          ) : (
            <h3>Set Tile Background Image</h3>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
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
                  <>
                    <Button
                      style={{ marginBottom: '10px' }}
                      variant="primary"
                      onClick={() => setTileState({ image: null })}
                    >
                      Remove Tile Background Image
                    </Button>
                    <img
                      src={state.image.url}
                      style={{
                        maxWidth: '80px',
                        maxHeight: '80px',
                        marginLeft: '10px',
                        marginBottom: '10px',
                        opacity: state.image.opacity + '%',
                        objectFit: 'contain',
                      }}
                      alt="Tile background"
                    />
                  </>
                ) : (
                  <Button
                    style={{ marginBottom: '10px' }}
                    variant="primary"
                    onClick={toggleImageSelect}
                  >
                    Set Tile Background Image
                  </Button>
                )}
                {state.image && (
                  <>
                    <EditableInput
                      value={state.image.opacity}
                      change={changeOpacity}
                      title="Image Opacity (1-100)"
                    />
                    <div className="form-check" style={{ marginTop: '15px', marginBottom: '10px' }}>
                      <input
                        className="form-check-input"
                        checked={state.image.usePixel}
                        onChange={toggleUsePixel}
                        type="checkbox"
                        id="pixelImageCheckbox"
                      />
                      <label className="form-check-label" htmlFor="pixelImageCheckbox">
                        Use pixel image?
                      </label>
                    </div>
                  </>
                )}
              </>
            )}

            <InputGroup className="mb-3" style={{ width: '100%', maxWidth: '320px' }}>
              <InputGroup.Text>Points</InputGroup.Text>
              <FormControl
                aria-label="Current Points"
                value={state.currPoints}
                disabled={!isGeneral || state.checked}
                onChange={(e) => inputState(e, 'currPoints')}
              />
              <InputGroup.Text>/</InputGroup.Text>
              <FormControl
                aria-label="Total Points"
                value={state.points}
                disabled={!isAdmin}
                onChange={(e) => inputState(e, 'points')}
              />
            </InputGroup>

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

                <div style={{ marginTop: '10px', marginBottom: '6px' }}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    onChange={handleProofImage}
                    style={{ display: 'none' }}
                    ref={proofFileInputRef}
                  />
                  {(state.proofImages || []).length < 10 ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => proofFileInputRef.current.click()}
                    >
                      📸 Upload Proof Image
                    </Button>
                  ) : (
                    <small style={{ color: 'var(--osrs-text-normal)', opacity: 0.7 }}>
                      Max 10 images reached
                    </small>
                  )}
                </div>

                {state.proofImages?.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    {state.proofImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={img}
                          onClick={() => openLightbox(i)}
                          style={{
                            width: '64px',
                            height: '64px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            border: '2px solid var(--osrs-border-dark)',
                            boxSizing: 'border-box',
                          }}
                          title="Click to enlarge"
                          alt="proof"
                        />
                        <button
                          onClick={() => removeProofImage(i)}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: '#c0392b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Remove image"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {state.lightboxIndex !== null && state.proofImages?.length > 0 && (
                  <div
                    onClick={closeLightbox}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0,0,0,0.85)',
                      zIndex: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {state.proofImages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleImage(-1);
                        }}
                        style={lightboxBtnStyle('left')}
                      >
                        &#8249;
                      </button>
                    )}
                    <img
                      src={state.proofImages[state.lightboxIndex]}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        maxWidth: '90vw',
                        maxHeight: '85vh',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        boxShadow: '0 4px 32px rgba(0,0,0,0.7)',
                      }}
                      alt="proof enlarged"
                    />
                    {state.proofImages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleImage(1);
                        }}
                        style={lightboxBtnStyle('right')}
                      >
                        &#8250;
                      </button>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '20px',
                        color: 'white',
                        fontSize: '1.1rem',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ opacity: 0.8 }}>
                        {state.lightboxIndex + 1} / {state.proofImages.length}
                      </span>
                      <span
                        style={{ cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                        onClick={closeLightbox}
                      >
                        ✖
                      </span>
                    </div>
                  </div>
                )}

                <div className="form-check" style={{ marginTop: '15px' }}>
                  <input
                    className="form-check-input bingo-completed-check"
                    checked={state.checked}
                    onChange={toggleCheck}
                    type="checkbox"
                    id="tileCompleted"
                  />
                  <label className="form-check-label" htmlFor="tileCompleted">
                    Completed?
                  </label>
                </div>
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
            <Alert>
              Click any image above to set it or type an item's name below as it would appear on
              the wiki.
              <br />
              Examples: Coins, Infernal cape, Bucket of milk, Beaver, Plank
            </Alert>
            <div style={{ display: 'flex' }}>
              <EditableInput
                value={state.wikiSearch}
                stateKey="wikiSearch"
                change={inputState}
                title="Item Search"
              />
            </div>
            {state.loading && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {state.triedToSearch && state.suggestions?.length === 0 && (
              <Alert>No results found, try searching something else</Alert>
            )}
            {state.suggestions?.length > 0 && (
              <ListGroup>
                {state.suggestions.map((item, i) => (
                  <ListGroup.Item key={i} action onClick={() => setImage(item.url, true)}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={item.thumbnail?.url}
                        style={{ maxWidth: '40px', maxHeight: '40px', paddingRight: '10px' }}
                        alt={item.title}
                      />
                      {item.title}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
            <br />
            <input
              type="file"
              accept=".png,.jpeg"
              onChange={handleCustomImage}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            <Button style={{ marginTop: '10px' }} onClick={() => fileInputRef.current.click()}>
              Custom image
            </Button>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="danger" onClick={handleClose}>
          Close
        </Button>
        <Button variant="success" onClick={handleSave}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
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

function lightboxBtnStyle(side) {
  return {
    position: 'absolute',
    [side]: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    fontSize: '2rem',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(4px)',
  };
}
