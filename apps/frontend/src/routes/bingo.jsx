import { useEffect, useRef, useState } from 'react';
//import { Link } from "react-router-dom";
import './bingo.css';
import BoardTile from '../components/BoardTile';
import EditableInput from '../components/ui/EditableInput';
import Button from '../components/ui/Button';

import { fetchGet, fetchPost, addToRecent } from '../utils/utils';
import { useNavigate } from 'react-router-dom';
import RecentBoards from '../components/RecentBoards';

const initialBingoState = {
  screen: 1,
  rows: 5,
  columns: 5,
  adminPassword: '',
  generalPassword: '',
  boardName: '',
  privilage: 'admin',
  joinPwTitle: 'general',
  joinPw: '',
  teams: 5,
};

function Bingo({ screenSkip }) {
  const navigate = useNavigate();
  const [state, setState] = useState(() => ({
    ...initialBingoState,
    ...(screenSkip ? { screen: screenSkip } : {}),
  }));
  const alertTimeoutRef = useRef(null);

  function setBingoState(stateChange) {
    setState((currentState) => ({
      ...currentState,
      ...stateChange,
    }));
  }

  useEffect(() => {
    if (
      localStorage.getItem('recentBoards') !== undefined &&
      localStorage.getItem('recentBoards') !== null
    ) {
      let recentBoards = JSON.parse(localStorage.getItem('recentBoards'));
      setState((currentState) => ({
        ...currentState,
        recentBoards: recentBoards,
      }));
    }

    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  function inputState(e, target) {
    setBingoState({ [target]: e.target.value });
  }

  function changeNum(value, target) {
    let currValue = state[target];
    currValue += value;
    if (currValue < 1) {
      currValue = 1;
    }
    if (currValue > 10) {
      currValue = 10;
    }
    setBingoState({ [target]: currValue });
  }

  function removeRecent(name) {
    const recentBoards = state.recentBoards.filter((thing) => thing.boardName !== name);
    setBingoState({ recentBoards });
    localStorage.setItem('recentBoards', JSON.stringify(recentBoards));
  }

  async function continueCreate() {
    const trimmedState = {
      ...state,
      adminPassword: state.adminPassword.trim(),
      generalPassword: state.generalPassword.trim(),
      boardName: state.boardName.trim(),
    };
    setBingoState(trimmedState);
    if (!trimmedState.generalPassword || !trimmedState.adminPassword || !trimmedState.boardName) {
      showAlert('danger', 'Please fill out all fields.');
      return;
    }

    const notAllowed = ['?', '#', '/', '\\'];
    for (let i = 0; i < notAllowed.length; i++) {
      if (
        trimmedState.boardName.includes(notAllowed[i]) ||
        trimmedState.generalPassword.includes(notAllowed[i]) ||
        trimmedState.adminPassword.includes(notAllowed[i])
      ) {
        showAlert(
          'danger',
          'Passwords and boardname cannot have these characters : ' + notAllowed.join(' ')
        );
        return;
      }
    }
    if (['join', 'create'].includes(trimmedState.boardName.toLowerCase())) {
      showAlert(
        'danger',
        "Name can't be join or create for routing purposes. This probably a rare message to ever see. Congrats"
      );
      return;
    }

    showAlert('loading');
    const [data, err] = await fetchPost('createBoard', { ...trimmedState });
    if (data) {
      addToRecent(trimmedState.boardName, trimmedState.adminPassword, 'admin');
      navigate('/bingo/' + trimmedState.boardName, {
        state: {
          adminPassword: trimmedState.adminPassword,
          generalPassword: trimmedState.generalPassword,
          teams: trimmedState.teams,
          boardName: trimmedState.boardName,
          privilage: 'admin',
          cameFromCreate: true,
        },
      });
    }
    if (err) {
      showAlert('danger', err.message);
      setBingoState({ isLoading: false });
      return;
    }
  }

  function showAlert(variant, message, skipTimeout = false) {
    if (variant === 'loading') {
      setBingoState({ alertVariant: 'warning', isLoading: true, alert: 'Loading...' });
    } else {
      setBingoState({ alertVariant: variant, alert: message });
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      if (skipTimeout) {
        return;
      }
      alertTimeoutRef.current = setTimeout(() => {
        setBingoState({ alert: '' });
      }, 5000);
    }
  }

  async function auth(recentSkip = false) {
    if (recentSkip && recentSkip.boardName) {
      let obj = {};
      obj.generalPassword = recentSkip.password;
      obj.adminPassword = recentSkip.password;
      obj.privilage = recentSkip.priv;
      obj.boardName = recentSkip.boardName;
      navigate('/bingo/' + obj.boardName, { state: obj });
      return;
    }

    let [, err] = await fetchGet(`auth/${state.boardName}/${state.joinPw}/${state.joinPwTitle}`);
    if (err) {
      showAlert('danger', err.message);
      return;
    }
    let navigationState = {
      boardName: state.boardName,
    };
    if (state.joinPwTitle === 'general') {
      navigationState.generalPassword = state.joinPw;
    } else {
      navigationState.adminPassword = state.joinPw;
      navigationState.privilage = 'general';
      navigationState.canSwitchPriv = true;
    }
    addToRecent(state.boardName, state.joinPw, state.joinPwTitle);
    navigate('/bingo/' + state.boardName, { state: navigationState });
  }

  return (
    <>
      {state.alert && (
        <div className={`osrs-alert-banner alert-${state.alertVariant}`}>{state.alert}</div>
      )}
      {/* {state.showToast && <Toast variant="danger" message={'uh ohohhh'} />} */}
      {state.screen === 1 && (
        <div className="start-screen">
          <div className="start-menu" onClick={() => navigate('/bingo/create')}>
            <h1 className="osrs-header">Create Bingo Board</h1>
          </div>
          <div className="start-menu" onClick={() => navigate('/bingo/join')}>
            <h1 className="osrs-header">Join Bingo Board</h1>
          </div>
        </div>
      )}
      {state.screen === 2 && (
        <div className="create-menu">
          <div className="create-board-shell">
            <div className="create-board-header">
              <div>
                <h1 className="osrs-header">Create Bingo Board</h1>
                <p>
                  Set the event basics now. Tiles, teams, passwords, and layered row reveals can be
                  adjusted from Edit Board after creation.
                </p>
              </div>
              <div className="create-board-badge">Auto-deletes after 3 years</div>
            </div>

            <div className="create-board-grid">
              <section className="create-board-panel">
                <h2 className="osrs-header">Board Details</h2>
                <p className="create-board-copy">
                  Pick a board name and casual access words for your clan. Do not use "real"
                  passwords here, I don't encrypt them on the backend.
                </p>
                <EditableInput
                  title="Board Name"
                  stateKey="boardName"
                  change={inputState}
                  value={state.boardName}
                />
                <EditableInput
                  title="Admin Password"
                  stateKey="adminPassword"
                  change={inputState}
                  value={state.adminPassword}
                />
                <EditableInput
                  title="General Password"
                  stateKey="generalPassword"
                  change={inputState}
                  value={state.generalPassword}
                />
                <div className="create-board-note">
                  <strong>Admin:</strong> edit tiles, points, images, teams, board size, and layered
                  rows.
                  <br />
                  <strong>General:</strong> submit team proof and mark revealed tiles complete.
                </div>
              </section>

              <section className="create-board-panel">
                <h2 className="osrs-header">Event Shape</h2>
                <p className="create-board-copy">
                  Start with the rough shape. You can resize later, but shrinking removes saved row,
                  column, or team data.
                </p>
                <div className="create-stepper-grid">
                  <div className="create-stepper">
                    <span>Rows</span>
                    <div>
                      <Button click={() => changeNum(-1, 'columns')} text="-"></Button>
                      <strong>{state.columns}</strong>
                      <Button click={() => changeNum(1, 'columns')} text="+"></Button>
                    </div>
                    <small>up and down</small>
                  </div>
                  <div className="create-stepper">
                    <span>Columns</span>
                    <div>
                      <Button click={() => changeNum(-1, 'rows')} text="-"></Button>
                      <strong>{state.rows}</strong>
                      <Button click={() => changeNum(1, 'rows')} text="+"></Button>
                    </div>
                    <small>left and right</small>
                  </div>
                  <div className="create-stepper">
                    <span>Teams</span>
                    <div>
                      <Button click={() => changeNum(-1, 'teams')} text="-"></Button>
                      <strong>{state.teams}</strong>
                      <Button click={() => changeNum(1, 'teams')} text="+"></Button>
                    </div>
                    <small>competing groups</small>
                  </div>
                </div>

                <div className="create-layer-callout">
                  <h3 className="osrs-header">Layered boards</h3>
                  <p>
                    After creation, admins can reveal only the first few rows to general users, then
                    unlock more rows as the event progresses.
                  </p>
                </div>

                <div className="create-board-preview">
                  {[...Array(state.columns)].map((_x, i) => (
                    <span key={i} className="flex">
                      {[...Array(state.rows)].map((_x, j) => (
                        <BoardTile
                          bare={true}
                          key={j}
                          br={state.rows === j + 1}
                          bb={state.columns === i + 1}
                          dem="34px"
                        />
                      ))}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="create-board-actions">
              <Button variant="success" click={continueCreate} text="Create Board"></Button>
            </div>
          </div>
        </div>
      )}
      {state.screen === 4 && (
        <div className="join-wrapper">
          <div className="join-board-shell">
            <div className="join-board-header">
              <div>
                <h1 className="osrs-header">Join Bingo Board</h1>
                <p>Enter the board name and the access word your event organizer shared.</p>
              </div>
              <Button variant="primary" click={() => navigate('/bingo/create')} text="Create New" />
            </div>

            <div className="join-board-grid">
              <section className="join-board-panel">
                <h2 className="osrs-header">Access</h2>
                <EditableInput
                  id="boardName"
                  title="Board Name"
                  stateKey="boardName"
                  change={inputState}
                  value={state.boardName}
                />

                <div className="join-mode-grid">
                  <button
                    type="button"
                    className={`join-mode-card ${state.joinPwTitle === 'general' ? 'is-active' : ''}`}
                    onClick={() => setBingoState({ joinPwTitle: 'general' })}
                  >
                    <span>General</span>
                    <small>Submit proof and track team progress.</small>
                  </button>
                  <button
                    type="button"
                    className={`join-mode-card ${state.joinPwTitle === 'admin' ? 'is-active' : ''}`}
                    onClick={() => setBingoState({ joinPwTitle: 'admin' })}
                  >
                    <span>Admin</span>
                    <small>Edit board setup, teams, layers, and tiles.</small>
                  </button>
                </div>

                <EditableInput
                  title={state.joinPwTitle === 'general' ? 'General Pw' : 'Admin Pw'}
                  value={state.joinPw}
                  change={(e) => setBingoState({ joinPw: e.target.value })}
                  enterAction={auth}
                />

                <div className="join-board-actions">
                  <Button variant="success" click={auth} text="Join Board"></Button>
                </div>
              </section>

              <section className="join-board-panel join-board-help">
                <h2 className="osrs-header">What You Need</h2>
                <ul>
                  <li>
                    <strong>Board name</strong> from the event organizer.
                  </li>
                  <li>
                    <strong>General password</strong> for normal team participation.
                  </li>
                  <li>
                    <strong>Admin password</strong> only if you are managing the board.
                  </li>
                </ul>
                <p>
                  Layered boards may reveal only part of the board at first. More rows unlock when
                  an admin opens them.
                </p>
              </section>
            </div>

            {state.recentBoards && state.recentBoards.length > 0 && (
              <RecentBoards click={auth} removeRecent={removeRecent} recent={state.recentBoards} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Bingo;
