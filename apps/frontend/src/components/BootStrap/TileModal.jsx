import { Component } from 'react';
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

class TileModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      wikiSearch: '',
      ...props.info,
      ...props.teamInfo,
      proofImages: props.teamInfo?.proofImages || [],
      proofImagesChanged: false,
      suggestions: [],
      storedSuggestions: {},
      lightboxIndex: null,
    };

    // Instance-scoped so stale rejections don't persist across mounts
    this.badTitles = [];
    this.listOfImages = [];

    this.inputState = this.inputState.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.toggleCheck = this.toggleCheck.bind(this);
    this.toggleUsePixel = this.toggleUsePixel.bind(this);
    this.setImage = this.setImage.bind(this);
    this.changeOpacity = this.changeOpacity.bind(this);
    this.toggleImageSelect = this.toggleImageSelect.bind(this);
    this.setSuggestions = this.setSuggestions.bind(this);
    this.handleCustomImage = this.handleCustomImage.bind(this);
    this.handleProofImage = this.handleProofImage.bind(this);
    this.removeProofImage = this.removeProofImage.bind(this);
    this.openLightbox = this.openLightbox.bind(this);
    this.closeLightbox = this.closeLightbox.bind(this);
    this.cycleImage = this.cycleImage.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    const setCurrSuggestionsImmediate = this.setCurrSuggestions.bind(this);
    this.setCurrSuggestions = debounce(setCurrSuggestionsImmediate, 600);
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    if (this.state.lightboxIndex === null) return;
    if (e.key === 'ArrowLeft') this.cycleImage(-1);
    else if (e.key === 'ArrowRight') this.cycleImage(1);
    else if (e.key === 'Escape') this.closeLightbox();
  }

  handleCustomImage(e) {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader();
      reader.onload = (event) => this.setImage(event.target.result, true);
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid PNG or JPEG file');
    }
  }

  inputState(e, target) {
    let value = e.target.value;
    if (NUM_INPUTS.includes(target)) {
      if (isNaN(value)) value = 0;
      if (target === 'currPoints' && Number(value) > Number(this.state.points)) {
        value = this.state.points;
      }
    }
    if (target === 'wikiSearch') {
      value = nameFilter(value);
      this.setCurrSuggestions(value);
    }
    this.setState({ [target]: value });
  }

  setCurrSuggestions() {
    this.setSuggestions(null);
    if (!this.state.wikiSearch.length) return;
    this.setState({ loading: true, triedToSearch: false });

    const url = `https://oldschool.runescape.wiki/rest.php/v1/search/title?q=${encodeURIComponent(this.state.wikiSearch)}&limit=5`;
    fetch(url)
      .then((res) => res.json())
      .then(async (data) => {
        const fetchPromises = (data.pages || []).map(async (item) => {
          if (!item.thumbnail || this.badTitles.includes(item.title)) return null;
          if (this.state.storedSuggestions[item.title]) return item;
          const imgUrl = getImageUrl(item.title);
          const response = await fetch(imgUrl);
          if (response.status === 200) {
            item.url = imgUrl;
            return item;
          }
          this.badTitles.push(item.title);
          return null;
        });

        const results = (await Promise.all(fetchPromises)).filter(Boolean);
        const storedSuggestions = { ...this.state.storedSuggestions };
        results.forEach((item) => {
          storedSuggestions[item.title] = item;
        });
        this.setState({ storedSuggestions }, () => this.setSuggestions(results));
      });
  }

  setSuggestions(curr) {
    if (!curr) {
      this.setState({ suggestions: [] });
      return;
    }
    const data = curr
      .filter((item) => this.state.storedSuggestions[item.title])
      .map((item) => this.state.storedSuggestions[item.title]);
    this.setState({ suggestions: data, triedToSearch: true, loading: false });
  }

  toggleImageSelect() {
    this.listOfImages = tileImages;
    this.setState({ chooseImage: true });
  }

  setImage(image, skipUrlBuild = false) {
    const url = skipUrlBuild ? image : getImageUrl(image);
    this.setState({ image: { opacity: '100', url, usePixel: false }, chooseImage: false });
  }

  toggleUsePixel() {
    this.setState((prev) => ({ image: { ...prev.image, usePixel: !prev.image.usePixel } }));
  }

  changeOpacity(e) {
    let val = Number(e.target.value);
    if (isNaN(val)) val = 100;
    val = Math.min(100, Math.max(1, val));
    this.setState((prev) => ({ image: { ...prev.image, opacity: val } }));
  }

  toggleCheck() {
    this.setState((prev) => ({ checked: !prev.checked, currPoints: this.state.points }));
  }

  handleSave() {
    let state = { ...this.state };
    if (this.props.privilage === 'admin') {
      delete state.checked;
      delete state.proof;
      delete state.currPoints;
    } else {
      state = { checked: state.checked, proof: state.proof, currPoints: state.currPoints };
      if (this.state.proofImagesChanged) state.proofImages = this.state.proofImages || [];
    }
    this.props.change(this.props.cord[0], this.props.cord[1], state);
    this.props.handleClose();
  }

  handleProofImage(e) {
    const MAX = 10;
    Array.from(e.target.files).forEach((file) => {
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        this.setState((prev) => {
          const current = prev.proofImages || [];
          if (current.length >= MAX) return null;
          return { proofImages: [...current, event.target.result], proofImagesChanged: true };
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  removeProofImage(index) {
    this.setState((prev) => ({
      proofImages: prev.proofImages.filter((_, i) => i !== index),
      lightboxIndex: null,
      proofImagesChanged: true,
    }));
  }

  openLightbox(index) {
    this.setState({ lightboxIndex: index });
  }
  closeLightbox() {
    this.setState({ lightboxIndex: null });
  }

  cycleImage(direction) {
    const len = (this.state.proofImages || []).length;
    if (!len) return;
    this.setState((prev) => ({ lightboxIndex: (prev.lightboxIndex + direction + len) % len }));
  }

  handleClose() {
    this.props.handleClose();
  }

  render() {
    const isAdmin = this.props.privilage === 'admin';
    const isGeneral = !isAdmin;

    return (
      <Modal
        show={this.props.show}
        onHide={this.handleClose}
        size="lg"
        aria-labelledby="tile-modal-title"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="tile-modal-title">
            {!this.state.chooseImage ? (
              isAdmin ? (
                <EditableInput
                  value={this.state.title}
                  stateKey="title"
                  change={this.inputState}
                  title="Title"
                />
              ) : (
                <h2>{this.state.title || 'Info'}</h2>
              )
            ) : (
              <h3>Set Tile Background Image</h3>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {!this.state.chooseImage ? (
            <>
              <EditableInput
                value={this.state.description}
                textArea
                stateKey="description"
                change={this.inputState}
                title="Description"
                disabled={isGeneral}
              />
              {this.props.br && (
                <EditableInput
                  value={this.state.rowBingo}
                  stateKey="rowBingo"
                  change={this.inputState}
                  title="Row Bonus"
                  disabled={isGeneral}
                />
              )}
              {this.props.bb && (
                <EditableInput
                  value={this.state.colBingo}
                  stateKey="colBingo"
                  change={this.inputState}
                  title="Column Bonus"
                  disabled={isGeneral}
                />
              )}

              {isAdmin && (
                <>
                  {this.state.image ? (
                    <>
                      <Button
                        style={{ marginBottom: '10px' }}
                        variant="primary"
                        onClick={() => this.setState({ image: null })}
                      >
                        Remove Tile Background Image
                      </Button>
                      <img
                        src={this.state.image.url}
                        style={{
                          maxWidth: '80px',
                          maxHeight: '80px',
                          opacity: this.state.image.opacity + '%',
                          objectFit: 'contain',
                        }}
                        alt="Tile background"
                      />
                    </>
                  ) : (
                    <Button
                      style={{ marginBottom: '10px' }}
                      variant="primary"
                      onClick={this.toggleImageSelect}
                    >
                      Set Tile Background Image
                    </Button>
                  )}
                  {this.state.image && (
                    <>
                      <EditableInput
                        value={this.state.image.opacity}
                        change={this.changeOpacity}
                        title="Image Opacity (1-100)"
                      />
                      <div
                        className="form-check"
                        style={{ marginTop: '15px', marginBottom: '10px' }}
                      >
                        <input
                          className="form-check-input"
                          checked={this.state.image.usePixel}
                          onChange={this.toggleUsePixel}
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
                  value={this.state.currPoints}
                  disabled={!isGeneral || this.state.checked}
                  onChange={(e) => this.inputState(e, 'currPoints')}
                />
                <InputGroup.Text>/</InputGroup.Text>
                <FormControl
                  aria-label="Total Points"
                  value={this.state.points}
                  disabled={!isAdmin}
                  onChange={(e) => this.inputState(e, 'points')}
                />
              </InputGroup>

              {isGeneral && (
                <>
                  <div className="flex">
                    <EditableInput
                      placeholder="Paste imgur or any link"
                      value={this.state.proof}
                      textArea
                      stateKey="proof"
                      change={this.inputState}
                      title="Proof"
                    />
                    <div className="flex" style={{ flexWrap: 'wrap' }}>
                      {detectURLs(this.state.proof).map((url, i) => (
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
                      onChange={this.handleProofImage}
                      style={{ display: 'none' }}
                      ref={(el) => {
                        this.proofFileInput = el;
                      }}
                    />
                    {(this.state.proofImages || []).length < 10 ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => this.proofFileInput.click()}
                      >
                        📷 Upload Proof Image
                      </Button>
                    ) : (
                      <small style={{ color: 'var(--osrs-text-normal)', opacity: 0.7 }}>
                        Max 10 images reached
                      </small>
                    )}
                  </div>

                  {this.state.proofImages?.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '10px',
                      }}
                    >
                      {this.state.proofImages.map((img, i) => (
                        <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={img}
                            onClick={() => this.openLightbox(i)}
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
                            onClick={() => this.removeProofImage(i)}
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
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {this.state.lightboxIndex !== null && this.state.proofImages?.length > 0 && (
                    <div
                      onClick={this.closeLightbox}
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
                      {this.state.proofImages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            this.cycleImage(-1);
                          }}
                          style={lightboxBtnStyle('left')}
                        >
                          &#8249;
                        </button>
                      )}
                      <img
                        src={this.state.proofImages[this.state.lightboxIndex]}
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
                      {this.state.proofImages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            this.cycleImage(1);
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
                          {this.state.lightboxIndex + 1} / {this.state.proofImages.length}
                        </span>
                        <span
                          style={{ cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                          onClick={this.closeLightbox}
                        >
                          ✕
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="form-check" style={{ marginTop: '15px' }}>
                    <input
                      className="form-check-input bingo-completed-check"
                      checked={this.state.checked}
                      onChange={this.toggleCheck}
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
              {Object.keys(this.listOfImages).map((image, i) => {
                const imageName =
                  image
                    .split('/')
                    .pop()
                    ?.replace(/\.png$/i, '') || image;
                return (
                  <img
                    key={i}
                    title={imageName}
                    src={this.listOfImages[image]}
                    onClick={() => this.setImage(imageName)}
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
                  value={this.state.wikiSearch}
                  stateKey="wikiSearch"
                  change={this.inputState}
                  title="Item Search"
                />
              </div>
              {this.state.loading && (
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              )}
              {this.state.triedToSearch && this.state.suggestions?.length === 0 && (
                <Alert>No results found, try searching something else</Alert>
              )}
              {this.state.suggestions?.length > 0 && (
                <ListGroup>
                  {this.state.suggestions.map((item, i) => (
                    <ListGroup.Item key={i} action onClick={() => this.setImage(item.url, true)}>
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
                onChange={this.handleCustomImage}
                style={{ display: 'none' }}
                ref={(el) => {
                  this.fileInput = el;
                }}
              />
              <Button style={{ marginTop: '10px' }} onClick={() => this.fileInput.click()}>
                Custom image
              </Button>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="danger" onClick={this.handleClose}>
            Close
          </Button>
          <Button variant="success" onClick={this.handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default TileModal;

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
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
