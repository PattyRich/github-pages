import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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
import type { ImageSuggestion, TeamTileInfo, TileInfo, TileModalState } from './tile-modal/types';
import './TileModal.css';

const NUM_INPUTS = ['points', 'currPoints', 'rowBingo', 'colBingo'];

export type {
  ImageSuggestion,
  TeamTileInfo,
  TileImage,
  TileInfo,
  TileModalState,
} from './tile-modal/types';

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
    if (file && ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') setImage(result, true);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid PNG, JPEG, WEBP, or GIF file');
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
    setTileState({ chooseImage: true });
  }

  function setImage(image: string | ImageSuggestion, skipUrlBuild = false) {
    isDirtyRef.current = true;
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
    isDirtyRef.current = true;
    updateTileState((currentState) => {
      if (!currentState.image) return null;
      return {
        image: { ...currentState.image, usePixel: !currentState.image.usePixel },
      };
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
    await change(cord[0], cord[1], stateToSave);
    handleClose();
  }

  function handleProofImage(e: ChangeEvent<HTMLInputElement>) {
    const MAX = 10;
    Array.from(e.target.files || []).forEach((file) => {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return;
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
    </ModalShell>
  );
}

function stripImageOpacity(image: TileModalState['image']) {
  if (!image) return image;
  const imageWithoutOpacity = { ...image };
  delete imageWithoutOpacity.opacity;
  return imageWithoutOpacity;
}

export default TileModal;
