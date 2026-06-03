import React from 'react';
//import { Link } from "react-router-dom";
import './bingo.css';
import BoardTile from '../components/BoardTile';
import 'bootstrap/dist/css/bootstrap.css';
import EditableInput from '../components/BootStrap/EditableInput';
import Button from '../components/BootStrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Alert from 'react-bootstrap/Alert';
import { fetchGet, fetchPost } from '../utils/utils';
import { useNavigate } from 'react-router-dom';
import RecentBoards from '../components/RecentBoards';

class Bingo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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

    if (this.props.screenSkip) {
      this.state.screen = this.props.screenSkip;
    }

    this.inputState = this.inputState.bind(this);
    this.changeNum = this.changeNum.bind(this);
    this.continue = this.continue.bind(this);
    this.alert = this.alert.bind(this);
    this.auth = this.auth.bind(this);
    this.removeRecent = this.removeRecent.bind(this);
  }

  componentDidMount() {
    if (
      localStorage.getItem('recentBoards') !== undefined &&
      localStorage.getItem('recentBoards') !== null
    ) {
      let recentBoards = JSON.parse(localStorage.getItem('recentBoards'));
      this.setState({ recentBoards: recentBoards });
    }
  }

  inputState(e, target) {
    let stateChange = {};
    stateChange[target] = e.target.value;
    this.setState(stateChange);
  }

  changeNum(value, target) {
    let currValue = this.state[target];
    currValue += value;
    let stateChange = {};
    if (currValue < 1) {
      currValue = 1;
    }
    if (currValue > 10) {
      currValue = 10;
    }
    stateChange[target] = currValue;

    this.setState(stateChange);
  }

  removeRecent(name) {
    let index = this.state.recentBoards.findIndex((thing) => {
      return thing.boardName === name;
    });
    let x = this.state.recentBoards;
    x.splice(index, 1);
    this.setState({ recentBoards: x });
    localStorage.setItem('recentBoards', JSON.stringify(x));
  }

  promisedSetState = (newState) => new Promise((resolve) => this.setState(newState, resolve));

  async continue() {
    let trim = {
      adminPassword: this.state.adminPassword.trim(),
      generalPassword: this.state.generalPassword.trim(),
      boardName: this.state.boardName.trim(),
    };
    await this.promisedSetState(trim);
    if (!this.state.generalPassword || !this.state.adminPassword || !this.state.boardName) {
      this.alert('danger', 'Please fill out all fields.');
      return;
    }

    const notAllowed = ['?', '#', '/', '\\'];
    for (let i = 0; i < notAllowed.length; i++) {
      if (
        this.state.boardName.includes(notAllowed[i]) ||
        this.state.generalPassword.includes(notAllowed[i]) ||
        this.state.adminPassword.includes(notAllowed[i])
      ) {
        this.alert(
          'danger',
          'Passwords and boardname cannot have these characters : ' + notAllowed.join(' ')
        );
        return;
      }
    }
    if (['join', 'create'].includes(this.state.boardName.toLowerCase())) {
      this.alert(
        'danger',
        "Name can't be join or create for routing purposes. This probably a rare message to ever see. Congrats"
      );
      return;
    }

    this.alert('loading');
    const [data, err] = await fetchPost('createBoard', { ...this.state });
    if (data) {
      this.addToRecent(
        this.state.recentBoards,
        this.state.boardName,
        this.state.adminPassword,
        'admin'
      );
      this.props.navigate('/bingo/' + this.state.boardName, {
        state: {
          adminPassword: this.state.adminPassword,
          generalPassword: this.state.generalPassword,
          teams: this.state.teams,
          boardName: this.state.boardName,
          privilage: 'admin',
          cameFromCreate: true,
        },
      });
    }
    if (err) {
      this.alert('danger', err.message);
      this.setState({ isLoading: false });
      return;
    }
  }

  alert(variant, message, skipTimeout = false) {
    if (variant === 'loading') {
      this.setState({ alertVariant: 'warning', isLoading: true, alert: 'Loading...' });
    } else {
      this.setState({ alertVariant: variant, alert: message });
      if (this.alertTimeout) {
        clearTimeout(this.alertTimeout);
      }
      if (skipTimeout) {
        return;
      }
      this.alertTimeout = setTimeout(() => {
        this.setState({ alert: '' });
      }, 5000);
    }
  }

  async auth(recentSkip = false) {
    if (recentSkip && recentSkip.boardName) {
      let obj = {};
      obj.generalPassword = recentSkip.password;
      obj.adminPassword = recentSkip.password;
      obj.privilage = recentSkip.priv;
      obj.boardName = recentSkip.boardName;
      this.props.navigate('/bingo/' + obj.boardName, { state: obj });
      return;
    }

    let [data, err] = await fetchGet(
      `auth/${this.state.boardName}/${this.state.joinPw}/${this.state.joinPwTitle}`
    );
    if (err) {
      this.alert('danger', err.message);
      return;
    }
    let state = {
      boardName: this.state.boardName,
    };
    if (this.state.joinPwTitle === 'general') {
      state.generalPassword = this.state.joinPw;
    } else {
      state.adminPassword = this.state.joinPw;
      state.privilage = 'general';
      state.canSwitchPriv = true;
    }
    this.addToRecent(
      this.state.recentBoards,
      this.state.boardName,
      this.state.joinPw,
      this.state.joinPwTitle
    );
    this.props.navigate('/bingo/' + this.state.boardName, { state });
  }

  addToRecent(recentBoards, boardName, joinPw, priv) {
    if (!recentBoards) {
      let obj = [
        {
          boardName: boardName,
          password: joinPw,
          priv: priv,
        },
      ];
      localStorage.setItem('recentBoards', JSON.stringify(obj));
    } else {
      let find = this.state.recentBoards.find((item) => {
        return item.boardName === this.state.boardName && priv === item.priv;
      });
      if (!find) {
        let x = recentBoards;
        let obj = {
          boardName: boardName,
          password: joinPw,
          priv: priv,
        };
        x.push(obj);
        localStorage.setItem('recentBoards', JSON.stringify(x));
      }
    }
  }

  render() {
    return (
      <>
        {this.state.alert && (
          <Alert className="osrs-alert-banner" variant={this.state.alertVariant}>
            {this.state.alert}
          </Alert>
        )}
        {/* {	this.state.showToast && 
					<Toast variant='danger' message={'uh ohohhh'} />
				} */}
        {this.state.screen === 1 && (
          <div className="start-screen">
            <div className="start-menu" onClick={() => this.props.navigate('/bingo/create')}>
              <h1 className="osrs-header">Create Bingo Board</h1>
            </div>
            <div className="start-menu" onClick={() => this.props.navigate('/bingo/join')}>
              <h1 className="osrs-header">Join Bingo Board</h1>
            </div>
          </div>
        )}
        {this.state.screen === 2 && (
          <div className="create-menu">
            <div className="create-board-shell">
              <div className="create-board-header">
                <div>
                  <h1 className="osrs-header">Create Bingo Board</h1>
                  <p>
                    Set the event basics now. Tiles, teams, passwords, and layered row reveals can
                    be adjusted from Edit Board after creation.
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
                    change={this.inputState}
                    value={this.state.boardName}
                  />
                  <EditableInput
                    title="Admin Password"
                    stateKey="adminPassword"
                    change={this.inputState}
                    value={this.state.adminPassword}
                  />
                  <EditableInput
                    title="General Password"
                    stateKey="generalPassword"
                    change={this.inputState}
                    value={this.state.generalPassword}
                  />
                  <div className="create-board-note">
                    <strong>Admin:</strong> edit tiles, points, images, teams, board size, and
                    layered rows.
                    <br />
                    <strong>General:</strong> submit team proof and mark revealed tiles complete.
                  </div>
                </section>

                <section className="create-board-panel">
                  <h2 className="osrs-header">Event Shape</h2>
                  <p className="create-board-copy">
                    Start with the rough shape. You can resize later, but shrinking removes saved
                    row, column, or team data.
                  </p>
                  <div className="create-stepper-grid">
                    <div className="create-stepper">
                      <span>Rows</span>
                      <div>
                        <Button click={() => this.changeNum(-1, 'columns')} text="-"></Button>
                        <strong>{this.state.columns}</strong>
                        <Button click={() => this.changeNum(1, 'columns')} text="+"></Button>
                      </div>
                      <small>up and down</small>
                    </div>
                    <div className="create-stepper">
                      <span>Columns</span>
                      <div>
                        <Button click={() => this.changeNum(-1, 'rows')} text="-"></Button>
                        <strong>{this.state.rows}</strong>
                        <Button click={() => this.changeNum(1, 'rows')} text="+"></Button>
                      </div>
                      <small>left and right</small>
                    </div>
                    <div className="create-stepper">
                      <span>Teams</span>
                      <div>
                        <Button click={() => this.changeNum(-1, 'teams')} text="-"></Button>
                        <strong>{this.state.teams}</strong>
                        <Button click={() => this.changeNum(1, 'teams')} text="+"></Button>
                      </div>
                      <small>competing groups</small>
                    </div>
                  </div>

                  <div className="create-layer-callout">
                    <h3 className="osrs-header">Layered boards</h3>
                    <p>
                      After creation, admins can reveal only the first few rows to general users,
                      then unlock more rows as the event progresses.
                    </p>
                  </div>

                  <div className="create-board-preview">
                    {[...Array(this.state.columns)].map((x, i) => (
                      <span key={i} className="flex">
                        {[...Array(this.state.rows)].map((x, j) => (
                          <BoardTile
                            bare={true}
                            key={j}
                            br={this.state.rows === j + 1}
                            bb={this.state.columns === i + 1}
                            dem="34px"
                          />
                        ))}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              <div className="create-board-actions">
                <Button variant="success" click={this.continue} text="Create Board"></Button>
              </div>
            </div>
          </div>
        )}
        {this.state.screen === 4 && (
          <div className="join-wrapper">
            <div className="join-board-shell">
              <div className="join-board-header">
                <div>
                  <h1 className="osrs-header">Join Bingo Board</h1>
                  <p>Enter the board name and the access word your event organizer shared.</p>
                </div>
                <Button
                  variant="primary"
                  click={() => this.props.navigate('/bingo/create')}
                  text="Create New"
                />
              </div>

              <div className="join-board-grid">
                <section className="join-board-panel">
                  <h2 className="osrs-header">Access</h2>
                  <EditableInput
                    id="boardName"
                    title="Board Name"
                    stateKey="boardName"
                    change={this.inputState}
                    value={this.state.boardName}
                  />

                  <div className="join-mode-grid">
                    <button
                      type="button"
                      className={`join-mode-card ${this.state.joinPwTitle === 'general' ? 'is-active' : ''}`}
                      onClick={() => this.setState({ joinPwTitle: 'general' })}
                    >
                      <span>General</span>
                      <small>Submit proof and track team progress.</small>
                    </button>
                    <button
                      type="button"
                      className={`join-mode-card ${this.state.joinPwTitle === 'admin' ? 'is-active' : ''}`}
                      onClick={() => this.setState({ joinPwTitle: 'admin' })}
                    >
                      <span>Admin</span>
                      <small>Edit board setup, teams, layers, and tiles.</small>
                    </button>
                  </div>

                  <InputGroup className="mb-3 join-password-input">
                    <InputGroup.Text>
                      {this.state.joinPwTitle === 'general' ? 'General Pw' : 'Admin Pw'}
                    </InputGroup.Text>
                    <FormControl
                      id="bingo-pw"
                      value={this.state.joinPw}
                      onChange={(e) => {
                        this.setState({ joinPw: e.target.value });
                      }}
                      onKeyUp={(e) => {
                        let code = e.keyCode || e.which;
                        if (code === 13) {
                          this.auth();
                        }
                      }}
                    />
                  </InputGroup>

                  <div className="join-board-actions">
                    <Button variant="success" click={this.auth} text="Join Board"></Button>
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

              {this.state.recentBoards && this.state.recentBoards.length > 0 && (
                <RecentBoards
                  click={this.auth}
                  removeRecent={this.removeRecent}
                  recent={this.state.recentBoards}
                />
              )}
            </div>
          </div>
        )}
      </>
    );
  }
}

function withHooks(Component) {
  return (props) => <Component {...props} navigate={useNavigate()} />;
}

export default withHooks(Bingo);
