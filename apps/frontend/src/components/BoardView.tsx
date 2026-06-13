import { useCallback, useEffect, useRef, useState } from 'react';
//import { Link } from "react-router-dom";
import './BoardView.css';
import BoardTile from './BoardTile';
import Button from './ui/Button';
import { fetchGet, fetchPut, pwUrlBuilder, addToRecent, decodePathSegment } from '../utils/utils';
import { apiUrl } from '../config/api';
import { useLocation, useNavigate } from 'react-router-dom';
import Teams from './Teams';
import Toast from './ui/Toast';
import Alert from './ui/Alert';
import EditTeams from './ui/EditTeams';
import type { TeamInfo } from './ui/EditTeams';
import SettingsModal from './ui/SettingsModal';
import FeedbackModal from './ui/FeedbackModal';
import PasswordModal from './ui/PasswordModal';
import { useAlert } from '../utils/useAlert';
import type { TeamTileInfo, TileInfo, TileModalState } from './ui/TileModal';

interface BoardTeamData {
  name: string;
  password?: string;
  teamData: TeamTileInfo[][];
}

interface BoardTeam extends TeamInfo {
  data: BoardTeamData;
  pointTotal?: number;
  team: number;
}

interface BoardApiResponse {
  boardData: TileInfo[][];
  generalPassword: string;
  teamData: BoardTeam[];
  teamPasswordsRequired?: boolean;
  visibleRows?: number | null;
}

interface BoardState {
  activeTeamIndex: number;
  adminPassword?: string;
  boardData?: TileInfo[][];
  boardJustCreated?: boolean | null;
  boardName?: string;
  cameFromCreate?: boolean;
  canSwitchPriv?: boolean;
  generalPassword?: string;
  generalPasswordCopy: string;
  privilege: string;
  privilage?: string;
  showEditTeams: boolean;
  showFeedback?: boolean;
  showSettings?: boolean;
  showToast?: boolean;
  showToast2?: boolean;
  teamData?: BoardTeam[];
  teamPasswordsRequired?: boolean;
  teams: number;
  visibleRows: number | null;
}

type BoardStateChange = Partial<BoardState>;
type BoardStateUpdater = BoardStateChange | ((previousState: BoardState) => BoardStateChange);
type PasswordPromptResolver = (value: string | null) => void;
type BoardUpdateInfo = Partial<TileModalState> & { teamId?: number };

const initialBoardState = {
  privilege: 'general',
  teams: 5,
  activeTeamIndex: 0,
  showEditTeams: false,
  generalPasswordCopy: '',
  visibleRows: null,
} satisfies BoardState;

function BoardView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<BoardState>(() => {
    const fromLocation = (location.state || {}) as Partial<BoardState>;
    const legacyPrivilege = fromLocation.privilege ?? fromLocation.privilage;
    const { privilege: _privilege, privilage: _privilage, ...rest } = fromLocation;
    return {
      ...initialBoardState,
      ...rest,
      privilege: legacyPrivilege ?? initialBoardState.privilege,
    };
  });
  const { alertMessage, alertVariant, showAlert: alert, clearAlert } = useAlert();
  const [, setResizeTick] = useState(0);
  const stateRef = useRef<BoardState>(state);
  const pendingStateCallbacksRef = useRef<Array<() => void>>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sseDisconnectedRef = useRef(false);
  const passwordResolveRef = useRef<PasswordPromptResolver | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<string | null>(null);
  const rowsRef = useRef<number | null>(null);
  const columnsRef = useRef<number | null>(null);

  const setBoardState = useCallback((newState: BoardStateUpdater, callback?: () => void) => {
    setState((previousState) => {
      const stateChange = typeof newState === 'function' ? newState(previousState) : newState;
      const nextState = {
        ...previousState,
        ...stateChange,
      };
      stateRef.current = nextState;
      return nextState;
    });
    if (callback) {
      pendingStateCallbacksRef.current.push(callback);
    }
  }, []);

  const promisedSetState = useCallback(
    (newState: BoardStateUpdater) =>
      new Promise<void>((resolve) => setBoardState(newState, resolve)),
    [setBoardState]
  );

  // Match the old componentDidMount/componentWillUnmount lifecycle.
  useEffect(() => {
    stateRef.current = state;
    const callbacks = pendingStateCallbacksRef.current.splice(0);
    callbacks.forEach((callback) => callback());
  }, [state]);

  function visibleBoardData(boardState = stateRef.current): TileInfo[][] {
    if (!boardState.boardData) {
      return [];
    }
    if (boardState.privilege !== 'general') {
      return boardState.boardData;
    }
    const visibleRows = Number(boardState.visibleRows) || boardState.boardData.length;
    return boardState.boardData.slice(0, visibleRows);
  }

  function calculateTeamPoints(boardState = stateRef.current): void {
    if (!boardState.teamData) return;
    const boardData = visibleBoardData(boardState);
    if (!boardData.length) return;
    const columns = boardData.length;
    const rows = boardData[0]?.length || 0;
    const teamData = JSON.parse(JSON.stringify(boardState.teamData)) as BoardTeam[];
    teamData.forEach((team) => {
      let pointTotal = 0;
      team.data.teamData.forEach((row, i) => {
        if (!boardData[i]) {
          return;
        }
        let addBonusRow = true;
        row.slice(0, rows).forEach((tile, j) => {
          if (addBonusRow && !tile.checked) {
            addBonusRow = false;
          }
          pointTotal += tile.checked ? Number(tile.currPoints) : 0;
          if (j === rows - 1)
            if (addBonusRow) {
              pointTotal += Number(boardData[i]?.[j]?.rowBingo);
            }
        });
      });
      team.pointTotal = pointTotal;
    });
    teamData.forEach((team) => {
      let pointTotal = 0;
      const visibleTeamData = team.data.teamData.slice(0, columns).map((row) => row.slice(0, rows));
      transpose(visibleTeamData).forEach((row, i) => {
        let addBonusRow = true;
        row.forEach((tile, j) => {
          if (addBonusRow && !tile.checked) {
            addBonusRow = false;
          }
          if (j === columns - 1)
            if (addBonusRow) {
              pointTotal += Number(boardData[j]?.[i]?.colBingo);
            }
        });
      });
      team.pointTotal = Number(team.pointTotal || 0) + pointTotal;
    });
    setBoardState({ teamData });
  }

  async function refreshData(firstLoad = false, changeTeam = false): Promise<void> {
    const currentState = stateRef.current;
    if (!currentState.adminPassword && !currentState.generalPassword) {
      alert('danger', 'No Password is set, return to main page and start again.', true);
      return;
    }
    const url = pwUrlBuilder(currentState);
    const [data, err] = await fetchGet<BoardApiResponse>(`getBoard/${url}`);
    if (err) {
      alert('danger', err.message);
      return;
    }
    if (!data) return;
    let activeTeamValue = 0;
    if (changeTeam) {
      const activeTeam = localStorage.getItem('activeTeam');
      if (activeTeam) {
        const activeTeamId = Number(activeTeam);
        if (activeTeamId <= data.teamData.length - 1 && activeTeamId >= 0) {
          activeTeamValue = activeTeamId;
        }
      }
    }

    setBoardState(
      {
        boardData: data.boardData,
        teams: data.teamData.length,
        teamData: data.teamData,
        activeTeamIndex: stateRef.current.activeTeamIndex || activeTeamValue,
        generalPasswordCopy: data.generalPassword,
        teamPasswordsRequired: data.teamPasswordsRequired,
        visibleRows: data.visibleRows ?? null,
      },
      () => {
        calculateTeamPoints();
        if (firstLoad) {
          if (stateRef.current.privilege === 'admin') {
            switchPrivilege();
          }
        }
      }
    );

    rowsRef.current = data.boardData[0]?.length || 0;
    columnsRef.current = data.boardData.length;
  }

  function connectSSE(): void {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (
      !(stateRef.current.generalPassword || stateRef.current.adminPassword) ||
      !stateRef.current.boardName
    ) {
      return;
    }
    const url = apiUrl(`events/${pwUrlBuilder(stateRef.current)}`);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (sseDisconnectedRef.current) {
        sseDisconnectedRef.current = false;
        clearAlert();
      }
      void refreshData();
    };

    es.onmessage = () => {
      void refreshData();
    };

    es.onerror = () => {
      if (!sseDisconnectedRef.current) {
        sseDisconnectedRef.current = true;
        alert('warning', 'Lost connection - updates paused, trying to reconnect...');
      }
    };
  }

  useEffect(() => {
    async function loadBoard() {
      const params = new URLSearchParams(location.search);
      const pw = params.get('password');
      const boardName = decodePathSegment(location.pathname.split('/').filter(Boolean).pop() || '');

      if (pw) {
        addToRecent(boardName, pw, 'general');

        await promisedSetState({
          privilege: 'general',
          generalPassword: pw,
          boardName: boardName,
        });
        navigate(location.pathname, {
          replace: true,
          state: {
            privilege: 'general',
            generalPassword: pw,
            boardName: boardName,
          },
        });
      } else {
        const currentState = stateRef.current;
        if (boardName && !currentState.boardName) {
          await promisedSetState({
            boardName: boardName,
          });
        }
      }

      const tileHint = localStorage.getItem('tile-hint');
      if (!tileHint) {
        localStorage.setItem('tile-hint', 'true');
        setBoardState({ showToast: true });
      }
      refreshData(!stateRef.current.cameFromCreate, true);
      if (stateRef.current.boardJustCreated) {
        alert('success', 'Board Successfully Created!');
        setBoardState({ boardJustCreated: null });
      }
      connectSSE();
    }

    loadBoard();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleResize() {
      setResizeTick((tick) => tick + 1);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function toggleTeamEdit(): void {
    setBoardState({ showEditTeams: !stateRef.current.showEditTeams });
  }

  async function changeBoardTileInfo(
    row: number,
    col: number,
    data: Partial<TileModalState>
  ): Promise<void> {
    const activeTeam = stateRef.current.teamData?.[stateRef.current.activeTeamIndex];
    if (!activeTeam) {
      alert('danger', 'No active team selected.');
      return;
    }
    return updateBoard(row, col, { ...data, teamId: activeTeam.team });
  }

  async function updateTeams(
    info: TeamInfo[],
    passwordRequired: boolean,
    rows: number,
    columns: number,
    visibleRows: number
  ): Promise<void> {
    const dataToSend = {
      teamData: info,
      passwordRequired,
      rows,
      columns,
      visibleRows,
    };
    alert('loading');
    const url = pwUrlBuilder(stateRef.current);
    const [, err] = await fetchPut(`updateTeams/${url}`, { dataToSend });
    if (err) {
      alert('danger', err.message);
      return;
    }
    await refreshData();
    alert('success', 'Teams Successfully Updated!');
  }

  function changeTeam(teamId: number): void {
    setBoardState({ activeTeamIndex: teamId });
  }

  async function switchPrivilege(): Promise<void> {
    if (stateRef.current.privilege === 'admin') {
      await promisedSetState({ privilege: 'general', canSwitchPriv: true });
      await refreshData();
    } else {
      await promisedSetState({ privilege: 'admin' });
      await refreshData();
    }
  }

  function clipboard(): void {
    void navigator.clipboard
      .writeText(
        `${window.location.href}?password=${encodeURIComponent(state.generalPasswordCopy)}`
      )
      .catch(() => undefined);
    setBoardState({ showToast2: true });
  }

  function showPasswordModal(message: string): Promise<string | null> {
    return new Promise((resolve) => {
      passwordResolveRef.current = resolve;
      setPasswordPrompt(message);
    });
  }

  function handlePasswordConfirm(value: string): void {
    setPasswordPrompt(null);
    passwordResolveRef.current?.(value);
    passwordResolveRef.current = null;
  }

  function handlePasswordCancel(): void {
    setPasswordPrompt(null);
    passwordResolveRef.current?.(null);
    passwordResolveRef.current = null;
  }

  async function updateBoard(
    row: number,
    col: number,
    info: BoardUpdateInfo,
    forcePrompt = false
  ): Promise<void> {
    alert('loading');
    let needToAddTeamPassword = false;
    let pw: string | null = null;
    if (stateRef.current.teamPasswordsRequired && stateRef.current.privilege !== 'admin') {
      const activeTeam = stateRef.current.teamData?.[stateRef.current.activeTeamIndex];
      if (!activeTeam) {
        alert('danger', 'No active team selected.');
        return;
      }
      pw = getTeamPassword(stateRef.current.boardName, activeTeam.data.name);
      if (pw === null || forcePrompt) {
        needToAddTeamPassword = true;
        const promptText = forcePrompt
          ? 'Your team password was incorrect. Please try again.'
          : 'Enter Team Password';
        pw = await showPasswordModal(promptText);
        if (pw === null) {
          alert('danger', 'No password entered aborting update.');
          return;
        }
      }
    }
    const url = pwUrlBuilder(stateRef.current, pw);
    const [, err] = await fetchPut(`updateBoard/${url}`, { row, col, info });
    if (err) {
      alert('danger', err.message);
      if (err.message === 'Your team password was incorrect.') {
        await updateBoard(row, col, info, true);
      }
      return;
    }
    if (needToAddTeamPassword) {
      const activeTeam = stateRef.current.teamData?.[stateRef.current.activeTeamIndex];
      if (!activeTeam) return;
      setTeamPassword(stateRef.current.boardName, activeTeam.data.name, pw);
    }
    alert('success', 'Board Successfully Updated!');
  }

  const showFeedback = localStorage.getItem('showFeedback') === 'true';
  let height = document.documentElement.clientHeight;
  let width = document.documentElement.clientWidth;
  const boardDataToShow = visibleBoardData(state);
  const activeTeam = state.teamData?.[state.activeTeamIndex];
  const renderColumns = boardDataToShow.length || columnsRef.current || 1;
  const renderRows = boardDataToShow[0]?.length || rowsRef.current || 1;
  let maxWidth = (width * 0.75) / renderRows;
  let maxHeight = (height * 0.75) / renderColumns;
  let dem = maxHeight < maxWidth ? maxHeight : maxWidth;
  //let dem = width < height ? (width / rowsRef.current)-40 : (height / columnsRef.current)-40;
  return (
    <div className="flex-wrapper-create">
      <div className="top-bar-container">
        <div className="title-bar">
          <h2 style={{ marginTop: '0px', fontSize: '2rem' }}> {state.boardName} </h2>
        </div>
        <div className="settings-bar">
          <div className="flex bingo-edit">
            <h2 className="mobile-only-title">{state.boardName}</h2>
            <Button
              click={() => setBoardState({ showSettings: true })}
              text="Settings"
              variant="primary"
            />
            {(state.privilege === 'admin' || state.canSwitchPriv) && (
              <>
                {state.privilege === 'admin' && (
                  <>
                    <Button click={toggleTeamEdit} text="Edit Board" variant="primary" />
                    <Button click={clipboard} variant="warning" text={'Auto Signin Link 📋'} />
                  </>
                )}
                {state.privilege === 'admin' ? (
                  <Button click={switchPrivilege} text="Admin Mode" variant="warning" />
                ) : (
                  <Button click={switchPrivilege} text="General Mode" variant="primary" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {alertMessage && (
        <Alert banner variant={alertVariant} dismissible onDismiss={clearAlert}>
          {alertMessage}
        </Alert>
      )}
      {activeTeam && !(state.privilege === 'admin') && (
        <div className="board-team-summary osrs-header">
          <h3 className="board-team-name">{activeTeam.data.name}</h3>
          <span className="board-team-points">(Points: {activeTeam.pointTotal})</span>
        </div>
      )}
      {state.boardData && (
        <div className="center-board">
          {boardDataToShow.map((row, i) => (
            <span key={i} className="flex">
              {row.map((tile, j) => (
                <BoardTile
                  cord={[i, j]}
                  change={changeBoardTileInfo}
                  info={tile}
                  teamInfo={
                    activeTeam && state.privilege !== 'admin'
                      ? activeTeam.data.teamData[i]?.[j]
                      : null
                  }
                  key={j}
                  dem={dem}
                  br={boardDataToShow[0].length === j + 1}
                  bb={boardDataToShow.length === i + 1}
                  privilege={state.privilege}
                />
              ))}
            </span>
          ))}
        </div>
      )}
      {state.teamData && activeTeam && state.privilege === 'general' && (
        <Teams changeTeam={changeTeam} teams={state.teamData} activeTeam={activeTeam} />
      )}
      {state.showEditTeams && state.teamData && (
        <EditTeams
          show={true}
          handleClose={toggleTeamEdit}
          teams={state.teamData}
          handleSave={updateTeams}
          passwordRequired={state.teamPasswordsRequired}
          columns={columnsRef.current || 1}
          rows={rowsRef.current || 1}
          visibleRows={state.visibleRows}
        />
      )}
      {state.showToast && (
        <Toast
          onClose={() => setBoardState({ showToast: false })}
          title="How to Use"
          position="middle-center"
          variant="info"
          message={'Click on the bingo tiles to edit them!'}
        />
      )}
      {state.showToast2 && (
        <Toast
          onClose={() => setBoardState({ showToast2: false })}
          message={
            "Copied to Clipboard. If you want to sign in as the admin again you'll need to auth from the main page."
          }
          variant={'success'}
          position={'top-end'}
          title={'Success'}
          timeout={5000}
        />
      )}
      {state.showSettings && (
        <SettingsModal handleClose={() => setBoardState({ showSettings: false })} />
      )}
      {!showFeedback && width > 1000 ? (
        <button
          type="button"
          className="feedback"
          onClick={() => setBoardState({ showFeedback: true })}
        >
          feedback
        </button>
      ) : (
        ''
      )}
      {state.showFeedback && (
        <FeedbackModal handleClose={() => setBoardState({ showFeedback: false })} />
      )}
      {passwordPrompt && (
        <PasswordModal
          message={passwordPrompt}
          onConfirm={handlePasswordConfirm}
          onCancel={handlePasswordCancel}
        />
      )}
    </div>
  );
}

export default BoardView;

function transpose<T>(matrix: T[][]): T[][] {
  if (!matrix.length) return [];
  return matrix[0].map((_col, i) => matrix.map((row) => row[i]));
}

function getTeamPassword(boardName?: string, teamName?: string): string | null {
  if (!boardName || !teamName) return null;
  const storedPasswords = localStorage.getItem(`${boardName}-teamPasswords`);
  if (storedPasswords) {
    const passwords = parseTeamPasswords(storedPasswords);
    if (passwords && typeof passwords[teamName] === 'string') {
      return passwords[teamName];
    }
  }
  return null;
}

function setTeamPassword(boardName?: string, teamName?: string, password?: string | null): void {
  if (!boardName || !teamName || password === null || password === undefined) return;
  const storedPasswords = localStorage.getItem(`${boardName}-teamPasswords`);
  const passwords = storedPasswords ? parseTeamPasswords(storedPasswords) || {} : {};
  passwords[teamName] = password;
  localStorage.setItem(`${boardName}-teamPasswords`, JSON.stringify(passwords));
}

function parseTeamPasswords(value: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    return null;
  }
  return null;
}
