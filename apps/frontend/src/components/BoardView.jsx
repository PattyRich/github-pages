import { useCallback, useEffect, useRef, useState } from 'react';
//import { Link } from "react-router-dom";
import './BoardView.css';
import BoardTile from './BoardTile';
import Button from './BootStrap/Button';
import Alert from 'react-bootstrap/Alert';
import { fetchGet, fetchPut, pwUrlBuilder } from '../utils/utils.js';
import { apiUrl } from '../config/api';
import { useLocation } from 'react-router-dom';
import Teams from './Teams';
import Toast from './BootStrap/Toast';
import EditTeams from './BootStrap/EditTeams';
import SettingsModal from './BootStrap/SettingsModal';
import FeedbackModal from './BootStrap/FeedbackModal';

const initialBoardState = {
  privilage: 'general',
  isLoading: false,
  alert: '',
  teams: 5,
  showEditTeams: false,
  generalPasswordCopy: '',
  visibleRows: null,
};

function BoardView() {
  const location = useLocation();
  const [state, setState] = useState(() => ({
    ...initialBoardState,
    ...(location.state || {}),
  }));
  const [, setResizeTick] = useState(0);
  const stateRef = useRef(state);
  const pendingStateCallbacksRef = useRef([]);
  const alertTimeoutRef = useRef(null);
  const eventSourceRef = useRef(null);
  const sseRetryTimeoutRef = useRef(null);
  const rowsRef = useRef(null);
  const columnsRef = useRef(null);

  const setBoardState = useCallback((newState, callback) => {
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
    (newState) => new Promise((resolve) => setBoardState(newState, resolve)),
    [setBoardState]
  );

  // Match the old componentDidMount/componentWillUnmount lifecycle.
  useEffect(() => {
    stateRef.current = state;
    const callbacks = pendingStateCallbacksRef.current.splice(0);
    callbacks.forEach((callback) => callback());
  }, [state]);

  function clearAlert() {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    setBoardState({ alert: '' });
  }

  function alert(variant, message, skipTimeout = false) {
    if (variant === 'loading') {
      setBoardState({ alertVariant: 'warning', isLoading: true, alert: 'Loading...' });
    } else {
      setBoardState({ alertVariant: variant, alert: message });
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      if (skipTimeout) {
        return;
      }
      alertTimeoutRef.current = setTimeout(() => {
        setBoardState({ alert: '' });
      }, 5000);
    }
  }

  function visibleBoardData(boardState = stateRef.current) {
    if (!boardState.boardData) {
      return [];
    }
    if (boardState.privilage !== 'general') {
      return boardState.boardData;
    }
    const visibleRows = Number(boardState.visibleRows) || boardState.boardData.length;
    return boardState.boardData.slice(0, visibleRows);
  }

  function calculateTeamPoints(boardState = stateRef.current) {
    if (!boardState.teamData) return;
    const boardData = visibleBoardData(boardState);
    if (!boardData.length) return;
    const columns = boardData.length;
    const rows = boardData[0]?.length || 0;
    let teamData = JSON.parse(JSON.stringify(boardState.teamData));
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
              pointTotal += Number(boardData[i][j].rowBingo);
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
              pointTotal += Number(boardData[j][i].colBingo);
            }
        });
      });
      team.pointTotal += pointTotal;
    });
    setBoardState({ teamData });
  }

  async function refreshData(firstLoad = false, changeTeam = false) {
    const currentState = stateRef.current;
    if (!currentState.adminPassword && !currentState.generalPassword) {
      alert('danger', 'No Password is set, return to main page and start again.', true);
      return;
    }
    let url = pwUrlBuilder(currentState);
    let [data, err] = await fetchGet(`getBoard/${url}`);
    if (err) {
      alert('danger', err.message);
      return;
    }
    let activeTeamValue = 0;
    if (changeTeam) {
      let activeTeam = localStorage.getItem('activeTeam');
      if (activeTeam) {
        activeTeam = Number(activeTeam);
        if (activeTeam <= data.teamData.length - 1 && activeTeam >= 0) {
          activeTeamValue = activeTeam;
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
        visibleRows: data.visibleRows,
      },
      () => {
        calculateTeamPoints();
        if (firstLoad) {
          if (stateRef.current.privilage === 'admin') {
            switchPrivilage();
          }
        }
      }
    );

    rowsRef.current = data.boardData[0].length;
    columnsRef.current = data.boardData.length;
  }

  function connectSSE() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (sseRetryTimeoutRef.current) {
      clearTimeout(sseRetryTimeoutRef.current);
    }
    if (
      !(stateRef.current.generalPassword || stateRef.current.adminPassword) ||
      !stateRef.current.boardName
    ) {
      sseRetryTimeoutRef.current = setTimeout(() => connectSSE(), 2000);
      return;
    }
    const url = apiUrl(`events/${pwUrlBuilder(stateRef.current)}`);
    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onopen = () => {
      refreshData();
    };

    eventSourceRef.current.onmessage = () => {
      refreshData();
    };

    eventSourceRef.current.onerror = () => {
      eventSourceRef.current.close();
      sseRetryTimeoutRef.current = setTimeout(() => connectSSE(), 20000);
    };
  }

  useEffect(() => {
    async function loadBoard() {
      const params = new URLSearchParams(location.search);
      const pw = params.get('password');
      if (pw) {
        const path = window.location.href.replace(/^https?:\/\//, '').split('/');
        await promisedSetState({
          privilage: 'general',
          generalPassword: pw,
          boardName: decodeURI(path[path.length - 1].split('?')[0]),
        });
      }

      const tileHint = localStorage.getItem('tile-hint');
      if (!tileHint) {
        localStorage.setItem('tile-hint', true);
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
      if (sseRetryTimeoutRef.current) {
        clearTimeout(sseRetryTimeoutRef.current);
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
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

  function toggleTeamEdit() {
    setBoardState({ showEditTeams: !stateRef.current.showEditTeams });
  }

  async function changeBoardTileInfo(row, col, data) {
    data.teamId = stateRef.current.teamData[stateRef.current.activeTeamIndex].team;
    await updateBoard(row, col, data);
  }

  async function updateTeams(info, passwordRequired, rows, columns, visibleRows) {
    const dataToSend = {
      teamData: info,
      passwordRequired,
      rows,
      columns,
      visibleRows,
    };
    alert('loading');
    let url = pwUrlBuilder(stateRef.current);
    let [, err] = await fetchPut(`updateTeams/${url}`, { dataToSend });
    if (err) {
      alert('danger', err.message);
      setBoardState({ isLoading: false });
      return;
    }
    await refreshData();
    setBoardState({ isLoading: false });
    alert('success', 'Teams Successfully Updated!');
  }

  function changeTeam(teamId) {
    setBoardState({ activeTeamIndex: teamId });
  }

  async function switchPrivilage() {
    if (stateRef.current.privilage === 'admin') {
      await promisedSetState({ privilage: 'general', canSwitchPriv: true });
      await refreshData();
    } else {
      await promisedSetState({ privilage: 'admin' });
      await refreshData();
    }
  }

  function clipboard() {
    void navigator.clipboard
      .writeText(`${window.location.href}?password=${encodeURIComponent(state.generalPasswordCopy)}`)
      .catch(() => undefined);
    setBoardState({ showToast2: true });
  }

  async function updateBoard(row, col, info, forcePrompt = false) {
    alert('loading');
    let needToAddTeamPassword = false;
    let pw;
    if (stateRef.current.teamPasswordsRequired && stateRef.current.privilage !== 'admin') {
      pw = getTeamPassword(
        stateRef.current.boardName,
        stateRef.current.teamData[stateRef.current.activeTeamIndex].data.name
      );
      if (pw === null || forcePrompt) {
        needToAddTeamPassword = true;
        const promptText = forcePrompt
          ? 'Your team password was incorrect. Please try again.'
          : 'Enter Team Password';
        pw = prompt(promptText);
        if (pw === null) {
          alert('danger', 'No password entered aborting update.');
          return;
        }
      }
    }
    let url = pwUrlBuilder(stateRef.current, pw);
    let [, err] = await fetchPut(`updateBoard/${url}`, { row, col, info });
    if (err) {
      alert('danger', err.message);
      setBoardState({ isLoading: false });

      if (err.message === 'Your team password was incorrect.') {
        updateBoard(row, col, info, true);
      }
      return;
    }
    if (needToAddTeamPassword) {
      setTeamPassword(
        stateRef.current.boardName,
        stateRef.current.teamData[stateRef.current.activeTeamIndex].data.name,
        pw
      );
    }
    setBoardState({ isLoading: false });
    alert('success', 'Board Successfully Updated!');
  }

  const showFeedback = localStorage.getItem('showFeedback') === 'true';
  let height = document.documentElement.clientHeight;
  let width = document.documentElement.clientWidth;
  const boardDataToShow = visibleBoardData(state);
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
          <h2 style={{ marginTop: '0px' }}> {state.boardName} </h2>
        </div>
        <div className="settings-bar">
          <div className="flex bingo-edit">
            <Button
              click={() => setBoardState({ showSettings: true })}
              text="Settings"
              variant="primary"
            />
            {(state.privilage === 'admin' || state.canSwitchPriv) && (
              <>
                {state.privilage === 'admin' && (
                  <>
                    <Button click={toggleTeamEdit} text="Edit Board" variant="primary" />
                    <Button
                      style={{ marginRight: '10px' }}
                      click={clipboard}
                      variant="warning"
                      text={'Auto Signin Link 📋'}
                    />
                  </>
                )}
                {state.privilage === 'admin' ? (
                  <Button click={switchPrivilage} text="Admin Mode" variant="warning" />
                ) : (
                  <Button click={switchPrivilage} text="General Mode" variant="primary" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {state.alert && (
        <Alert onClick={clearAlert} className="osrs-alert-banner" variant={state.alertVariant}>
          {state.alert}
        </Alert>
      )}
      {state.teamData && !(state.privilage === 'admin') && (
        <div style={{ alignItems: 'center' }} className="flex-center osrs-header">
          <h3 className="flex-center" style={{ marginBottom: 0 }}>
            {' '}
            {state.teamData[state.activeTeamIndex].data.name}
          </h3>
          <span style={{ marginLeft: '10px', fontSize: '1.2rem' }}>
            {' '}
            (Points: {state.teamData[state.activeTeamIndex].pointTotal}){' '}
          </span>
        </div>
      )}
      {state.boardData && (
        <div className="center-board">
          {boardDataToShow.map((row, i) => (
            <span key={i} className="flex">
              {row.map((_tile, j) => (
                <BoardTile
                  cord={[i, j]}
                  change={changeBoardTileInfo}
                  info={boardDataToShow[i][j]}
                  teamInfo={
                    state.teamData && state.privilage !== 'admin'
                      ? state.teamData[state.activeTeamIndex].data.teamData[i][j]
                      : null
                  }
                  key={j}
                  dem={dem}
                  br={boardDataToShow[0].length === j + 1}
                  bb={boardDataToShow.length === i + 1}
                  privilage={state.privilage}
                />
              ))}
            </span>
          ))}
        </div>
      )}
      {state.teamData && state.privilage === 'general' && (
        <Teams
          changeTeam={changeTeam}
          teams={state.teamData}
          activeTeam={state.teamData[state.activeTeamIndex]}
        />
      )}
      {state.showEditTeams && (
        <EditTeams
          show={true}
          handleClose={toggleTeamEdit}
          teams={state.teamData}
          handleSave={updateTeams}
          passwordRequired={state.teamPasswordsRequired}
          columns={columnsRef.current}
          rows={rowsRef.current}
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
        <div className="feedback" onClick={() => setBoardState({ showFeedback: true })}>
          feedback
        </div>
      ) : (
        ''
      )}
      {state.showFeedback && (
        <FeedbackModal handleClose={() => setBoardState({ showFeedback: false })} />
      )}
    </div>
  );
}

export default BoardView;

function transpose(matrix) {
  return matrix[0].map((_col, i) => matrix.map((row) => row[i]));
}

function getTeamPassword(boardName, teamName) {
  let pws = localStorage.getItem(`${boardName}-teamPasswords`);
  if (pws) {
    pws = JSON.parse(pws);
    if (teamName in pws) {
      return pws[teamName];
    }
  }
  return null;
}

function setTeamPassword(boardName, teamName, password) {
  let pws = localStorage.getItem(`${boardName}-teamPasswords`);
  if (pws) {
    pws = JSON.parse(pws);
    pws[teamName] = password;
  } else {
    pws = {};
    pws[teamName] = password;
  }
  localStorage.setItem(`${boardName}-teamPasswords`, JSON.stringify(pws));
}
