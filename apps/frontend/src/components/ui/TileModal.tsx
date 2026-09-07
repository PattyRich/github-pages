import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import Alert from './Alert';
import EditableInput from './EditableInput';
import { ModalButton, ModalShell } from './ModalShell';
import { debounce } from '../../utils/utils';
import { DEFAULT_BOARD_TYPE, type BoardType } from '../../types';
import TileDetailsPanel from './tile-modal/TileDetailsPanel';
import TileImagePicker from './tile-modal/TileImagePicker';
import { fetchCommonsSuggestions, fetchOsrsSuggestions } from './tile-modal/imageSearch';
import {
  cacheSuggestion,
  getImageUrl,
  isAnimatedImageUrl,
  nameFilter,
  suggestionKey,
} from './tile-modal/imageUtils';
import {
  normalizeRevision,
  type ImageSuggestion,
  type TeamTileInfo,
  type TileInfo,
  type TileModalState,
  type TileSaveContext,
} from './tile-modal/types';
import { isSaveConflictError } from '../../utils/utils';
import './TileModal.css';

const NUM_INPUTS = ['points', 'currPoints', 'rowBingo', 'colBingo'];

export type {
  ImageSuggestion,
  TeamTileInfo,
  TileImage,
  TileInfo,
  TileModalState,
  TileSaveContext,
} from './tile-modal/types';

interface TileModalProps {
  bb?: boolean;
  boardType?: BoardType;
  br?: boolean;
  boardSettingsRevision?: number;
  change: (
    row: number,
    col: number,
    info: Partial<TileModalState>,
    saveContext: TileSaveContext
  ) => Promise<boolean>;
  cord: [number, number];
  handleClose: () => void;
  info?: TileInfo;
  onDraftStateChange?: (dirty: boolean) => void;
  onConflictReload?: () => Promise<boolean>;
  privilege?: string;
  show?: boolean;
  teamId?: number;
  teamInfo?: TeamTileInfo | null;
}

function TileModal({
  cord,
  change,
  handleClose,
  info = {},
  boardSettingsRevision,
  onConflictReload,
  teamInfo,
  teamId,
  onDraftStateChange,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedSetCurrSuggestionsRef = useRef<((searchValue?: string) => void) | null>(null);
  const wikiSearchSeqRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const pendingFileReadsRef = useRef(0);
  const reloadInFlightRef = useRef(false);
  const draftContextRef = useRef<TileSaveContext>(
    createTileSaveContext(info, teamInfo, {
      boardSettingsRevision,
      privilege,
      teamId,
    })
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isConflict, setIsConflict] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function markDirty() {
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      onDraftStateChange?.(true);
    }
  }

  function closeModal() {
    onDraftStateChange?.(false);
    handleClose();
  }

  useEffect(() => () => onDraftStateChange?.(false), [onDraftStateChange]);

  function setTileState(stateChange: Partial<TileModalState>) {
    if (saveInFlightRef.current) return;
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
    if (saveInFlightRef.current) return;
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
    const data = curr.map(
      (item) => storedSuggestions[suggestionKey(item)] || storedSuggestions[item.title] || item
    );
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
          cacheSuggestion(storedSuggestions, item);
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
      if (!saveInFlightRef.current) {
        draftContextRef.current = createTileSaveContext(info, teamInfo, {
          boardSettingsRevision,
          privilege,
          teamId,
        });
      }
    }
  }, [boardSettingsRevision, info, privilege, teamId, teamInfo]);

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

  function readFileAsDataUrl(file: File, onLoad: (result: string) => void) {
    pendingFileReadsRef.current += 1;
    setIsReadingFile(true);

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      pendingFileReadsRef.current = Math.max(0, pendingFileReadsRef.current - 1);
      if (pendingFileReadsRef.current === 0) setIsReadingFile(false);
    };
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') onLoad(result);
      } finally {
        finish();
      }
    };
    reader.onerror = finish;
    reader.onabort = finish;
    try {
      reader.readAsDataURL(file);
    } catch {
      finish();
    }
  }

  function handleCustomImage(e: ChangeEvent<HTMLInputElement>) {
    if (saveInFlightRef.current || pendingFileReadsRef.current > 0) return;
    const file = e.target.files?.[0];
    if (file && ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      markDirty();
      readFileAsDataUrl(file, (result) => setImage(result, true));
    } else {
      alert('Please select a valid PNG, JPEG, WEBP, or GIF file');
    }
  }

  function inputState(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, target?: string) {
    if (!target || saveInFlightRef.current) return;
    markDirty();
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
    if (saveInFlightRef.current) return;
    setTileState({ chooseImage: true });
  }

  function setImage(image: string | ImageSuggestion, skipUrlBuild = false) {
    if (saveInFlightRef.current) return;
    markDirty();
    const nextImage =
      typeof image === 'string'
        ? {
            url: skipUrlBuild ? image : getImageUrl(image),
            animated: skipUrlBuild && isAnimatedImageUrl(image),
            usePixel: false,
          }
        : {
            animated:
              image.animated ||
              image.sourceName === 'OSRS Wiki GIF' ||
              isAnimatedImageUrl(image.url),
            attribution: image.attribution,
            license: image.license,
            licenseUrl: image.licenseUrl,
            sourceName: image.sourceName,
            sourceUrl: image.sourceUrl,
            url: image.url,
            usePixel: false,
          };
    setTileState({ image: nextImage, chooseImage: false });
  }

  function toggleUsePixel() {
    if (saveInFlightRef.current) return;
    markDirty();
    updateTileState((currentState) => {
      if (!currentState.image) return null;
      return {
        image: { ...currentState.image, usePixel: !currentState.image.usePixel },
      };
    });
  }

  function toggleCheck() {
    if (saveInFlightRef.current) return;
    markDirty();
    updateTileState((currentState) => ({
      checked: !currentState.checked,
      currPoints:
        currentState.points === '' || currentState.points == null ? 0 : currentState.points,
    }));
  }

  async function handleSave() {
    if (saveInFlightRef.current || pendingFileReadsRef.current > 0) return;
    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    setIsConflict(false);

    let stateToSave: Partial<TileModalState> = { ...stateRef.current };
    if (privilege === 'admin') {
      delete stateToSave.checked;
      delete stateToSave.proof;
      delete stateToSave.currPoints;
      stateToSave.image = stripImageOpacity(stateToSave.image);
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
    try {
      const saved = await change(cord[0], cord[1], stateToSave, draftContextRef.current);
      if (saved === true) closeModal();
    } catch (error) {
      if (isSaveConflictError(error)) {
        setIsConflict(true);
        setSaveError(error.message);
      } else {
        setSaveError('Could not save this tile. Try again.');
      }
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  async function handleConflictReload() {
    if (!onConflictReload || reloadInFlightRef.current) return;
    reloadInFlightRef.current = true;
    setIsReloading(true);
    setSaveError(null);
    try {
      const loaded = await onConflictReload();
      if (loaded === true) closeModal();
      else {
        setIsConflict(true);
        setSaveError('Could not load the latest tile data. Try again.');
      }
    } catch {
      setIsConflict(true);
      setSaveError('Could not load the latest tile data. Try again.');
    } finally {
      reloadInFlightRef.current = false;
      setIsReloading(false);
    }
  }

  function handleProofImage(e: ChangeEvent<HTMLInputElement>) {
    if (saveInFlightRef.current || pendingFileReadsRef.current > 0) return;
    const MAX = 10;
    markDirty();
    Array.from(e.target.files || []).forEach((file) => {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return;
      readFileAsDataUrl(file, (result) => {
        updateTileState((currentState) => {
          const current = currentState.proofImages || [];
          if (current.length >= MAX) return null;
          return { proofImages: [...current, result], proofImagesChanged: true };
        });
      });
    });
    e.target.value = '';
  }

  function removeProofImage(index: number) {
    if (saveInFlightRef.current) return;
    markDirty();
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
  const isBusy = isSaving || isReadingFile || isReloading;
  const searchInputTitle = isGenericBoard ? 'Image Search' : 'Item Search';
  const searchProviderName = isGenericBoard ? 'Wikimedia Commons' : 'the OSRS wiki';
  const showRowBonus = br && (isAdmin || Number(state.rowBingo) !== 0);
  const showColumnBonus = bb && (isAdmin || Number(state.colBingo) !== 0);

  const modalTitle = !state.chooseImage ? (
    isAdmin ? (
      <EditableInput
        value={state.title}
        stateKey="title"
        change={inputState}
        title="Title"
        disabled={isBusy}
      />
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
      onClose={isBusy ? undefined : closeModal}
      maxWidth="800px"
      footer={
        <>
          <ModalButton variant="danger" onClick={closeModal} disabled={isBusy}>
            Close
          </ModalButton>
          <ModalButton variant="success" onClick={handleSave} disabled={isBusy}>
            {isSaving ? 'Saving…' : isReadingFile ? 'Reading…' : 'Save'}
          </ModalButton>
        </>
      }
    >
      {saveError && (
        <Alert variant={isConflict ? 'warning' : 'danger'} role="alert">
          <div>{saveError}</div>
          {isConflict && onConflictReload && (
            <>
              <p>Discard this draft and reopen the tile with the latest board data.</p>
              <ModalButton
                variant="warning"
                onClick={() => void handleConflictReload()}
                disabled={isBusy}
              >
                {isReloading ? 'Loading latest…' : 'Discard draft and reload'}
              </ModalButton>
            </>
          )}
        </Alert>
      )}
      <fieldset
        disabled={isBusy}
        aria-busy={isBusy}
        style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
      >
        {!state.chooseImage ? (
          <TileDetailsPanel
            closeLightbox={closeLightbox}
            cycleImage={cycleImage}
            handleProofImage={handleProofImage}
            inputState={inputState}
            isAdmin={isAdmin}
            isGeneral={isGeneral}
            isGenericBoard={isGenericBoard}
            openLightbox={openLightbox}
            proofFileInputRef={proofFileInputRef}
            removeProofImage={removeProofImage}
            setTileState={setTileState}
            showColumnBonus={showColumnBonus}
            showRowBonus={showRowBonus}
            state={state}
            toggleCheck={toggleCheck}
            toggleImageSelect={toggleImageSelect}
            toggleUsePixel={toggleUsePixel}
          />
        ) : (
          <TileImagePicker
            fileInputRef={fileInputRef}
            handleCustomImage={handleCustomImage}
            inputState={inputState}
            isGenericBoard={isGenericBoard}
            searchInputTitle={searchInputTitle}
            searchProviderName={searchProviderName}
            setImage={setImage}
            state={state}
          />
        )}
      </fieldset>
    </ModalShell>
  );
}

function stripImageOpacity(image: TileModalState['image']) {
  if (!image) return image;
  const imageWithoutOpacity = { ...image };
  delete imageWithoutOpacity.opacity;
  return imageWithoutOpacity;
}

function createTileSaveContext(
  info: TileInfo,
  teamInfo: TeamTileInfo | null | undefined,
  options: {
    boardSettingsRevision?: number;
    privilege?: string;
    teamId?: number;
  }
): TileSaveContext {
  const isAdmin = options.privilege === 'admin';
  return {
    expectedRevision: normalizeRevision(isAdmin ? info.revision : teamInfo?.revision),
    expectedSettingsRevision: normalizeRevision(options.boardSettingsRevision),
    ...(isAdmin
      ? {}
      : {
          expectedBoardTileRevision: normalizeRevision(info.revision),
          teamId: options.teamId,
        }),
  };
}

export default TileModal;
