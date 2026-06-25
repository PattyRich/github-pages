import React from 'react';
//import { Link } from "react-router-dom";
import './osrs.css';
import { loot } from './looter/looter';
import { totalLooter } from './looter/totalLooter';
import TotalLoot from './TotalLoot';
import { assetUrl } from '../../utils/assetUrl';
import { capitalizeFirstLetter } from '../../utils/utils';

const imageModules = import.meta.glob('../../assets/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
const lootDataModules = import.meta.glob('./looter/*.js');
let plotlyPromise;

function getPlotly() {
  if (!plotlyPromise) {
    plotlyPromise = new Promise((resolve, reject) => {
      if (window.Plotly) {
        resolve(window.Plotly);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-2.30.0.min.js';
      script.async = true;
      script.onload = () => resolve(window.Plotly);
      script.onerror = () => reject(new Error('Failed to load Plotly.'));
      document.head.appendChild(script);
    });
  }
  return plotlyPromise;
}

export const cluesLvl = ['beginner', 'easy', 'medium', 'hard', 'elite', 'master'];
let failedImages = [];
const cluesData = {};
cluesLvl.forEach((lvl) => (cluesData[lvl] = null));

class Osrs extends React.Component {
  constructor() {
    super();
    this.state = {
      mode: 'cox',
      rewards: null,
      rolls: '',
      averageKillsPerDrop: null,
      lastSimulation: null,
      nothingCounter: 0,
      rewardList: [],
      rewardCount: 0,
      rewardCountConst: 0,
      points: 30000,
      pets: true,
      histogramData: [],
      simulationPlot: null,
      plotMode: 'chance',
      simulations: 1000,
      fullRewards: false,
      fullLootRewards: [],
      icons: {},
      bosses: [],
      progress: 0,
      teamSize: 4,
      cms: false,
      invocation: 300,
      worstRewards: null,
      bestRewards: null,
      clue: 'beginner',
      hovering: -1,
      createData: {
        bossName: 'Name me',
        numItems: 1,
        items: [
          {
            name: 'Saradomin godsword',
            rate: '1/100',
          },
        ],
        pet: {
          name: 'Baby mole',
          rate: '1/5000',
        },
      },
    };

    if (
      localStorage.getItem('bosses') !== undefined &&
      localStorage.getItem('bosses') !== null &&
      localStorage.getItem('bosses').length
    ) {
      try {
        this.state.bosses = JSON.parse(localStorage.getItem('bosses'));
      } catch (err) {
        console.log(err, 'error parsing bosses from cache');
      }
    }

    this.onChangeValue = this.onChangeValue.bind(this);
    this.onChangeValueInput = this.onChangeValueInput.bind(this);
    this.go = this.go.bind(this);
    this.stopInterval = this.stopInterval.bind(this);
    this.graphSimulation = this.graphSimulation.bind(this);
    this.setPlotMode = this.setPlotMode.bind(this);
    this.lootFunction = this.lootFunction.bind(this);
    this.saveBoss = this.saveBoss.bind(this);
    this.selectBoss = this.selectBoss.bind(this);
    this.deleteBoss = this.deleteBoss.bind(this);
    this.completion = this.completion.bind(this);
    this.clearData = this.clearData.bind(this);
    this.interval = null;
  }

  clearData = () => {
    let rewardList = [];
    let rewardCount = 0;
    let rewards = null;
    let fullLootRewards = [];
    this.setState({
      rewardList,
      rewardCount,
      rewards,
      fullLootRewards,
      lastSimulation: null,
      simulationPlot: null,
      progress: 0,
      bestRewards: null,
      worstRewards: null,
    });
  };

  async onChangeValue(event) {
    this.setState({
      mode: event.target.value,
      lastSimulation: null,
      simulationPlot: null,
      progress: 0,
      bestRewards: null,
      worstRewards: null,
    });
    this.completion(event.target.value);
  }

  hoverHandler(bool) {
    this.setState({ hovering: bool });
  }

  saveBoss() {
    let index = this.state.bosses.findIndex((x) => x.bossName === this.state.createData.bossName);
    if (index > -1) {
      return;
    }
    let data = this.state.bosses;
    data.push(this.state.createData);
    this.setState({ bosses: data });
    localStorage.setItem('bosses', JSON.stringify(data));
  }

  selectBoss(name) {
    let index = this.state.bosses.findIndex((x) => x.bossName === name);
    this.setState({
      createData: this.state.bosses[index],
      simulationPlot: null,
      progress: 0,
      bestRewards: null,
      worstRewards: null,
    });
  }

  deleteBoss() {
    let index = this.state.bosses.findIndex((x) => x.bossName === this.state.createData.bossName);
    if (index < 0) {
      return;
    }
    let data = this.state.bosses;
    data.splice(index, 1);
    this.setState({ bosses: data });
    localStorage.setItem('bosses', JSON.stringify(data));
  }

  onChangeValueInput(state, event) {
    const nextState = { [state]: event.target.value };
    if (shouldClearSimulationPlot(state)) {
      Object.assign(nextState, {
        simulationPlot: null,
        progress: 0,
        bestRewards: null,
        worstRewards: null,
      });
    }

    this.setState(nextState, () => {
      if (state == 'points' || state == 'teamSize' || state == 'invocation') {
        this.completion();
      }
    });
  }

  showPlotData(type) {
    if (type == 'best') {
      this.setState({ rewards: this.state.bestRewards });
    } else {
      this.setState({ rewards: this.state.worstRewards });
    }
  }

  clearPlots() {
    if (window.Plotly) {
      const chart = document.getElementById('simulation-chart');
      if (chart) {
        window.Plotly.purge(chart);
      }
    }
    this.setState({
      bestRewards: null,
      worstRewards: null,
      simulationPlot: null,
      plotMode: 'chance',
      progress: 0,
    });
  }

  setPlotMode(plotMode) {
    this.setState({ plotMode }, () => this.renderSimulationPlot());
  }

  async renderSimulationPlot() {
    if (!this.state.simulationPlot || !document.getElementById('simulation-chart')) {
      return;
    }

    const Plotly = await getPlotly();
    const figure = buildSimulationFigure(
      this.state.simulationPlot,
      this.state.plotMode,
      this.state.completion
    );
    Plotly.react('simulation-chart', figure.data, figure.layout, figure.config);
  }

  changeCreateData(thing, data, index) {
    let copy = { ...this.state.createData };
    if (thing === 'num') {
      copy.numItems = data;
      if (copy.items.length >= copy.numItems) {
        copy.items.pop();
      } else {
        copy.items.push({ name: '', rate: '1/100' });
      }
    } else if (thing === 'name') {
      copy.items[index].name = nameFilter(data);
    } else if (thing === 'rate') {
      copy.items[index].rate = rateFilter(data);
    } else if (thing === 'petRate') {
      copy.pet.rate = rateFilter(data);
    } else if (thing === 'petName') {
      copy.pet.name = nameFilter(data);
    } else if (thing === 'bossName') {
      copy.bossName = data;
    }

    function nameFilter(name) {
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    function rateFilter(rate) {
      return rate.replace(/[^0-9/.]/g, '');
    }

    this.setState({
      createData: copy,
      simulationPlot: null,
      progress: 0,
      bestRewards: null,
      worstRewards: null,
    });
  }

  async addIcons(mode, loot = null) {
    let iconClone = { ...this.state.icons };

    if (loot) {
      let promiseArray = [];
      for (let i = 0; i < loot.length; i++) {
        promiseArray.push(getIcon(loot[i].name));
      }
      await Promise.all(promiseArray);
      this.setState({ icons: iconClone });
      return;
    }

    if (mode === 'create') {
      let data = { ...this.state.createData };
      let promiseArray = [];
      for (let i = 0; i < data.items.length; i++) {
        promiseArray.push(getIcon(data.items[i].name));
      }
      if (data.pet) {
        promiseArray.push(getIcon(data.pet.name));
      }
      await Promise.all(promiseArray);
      this.setState({ icons: iconClone });
      return;
    }

    const loadLootData = lootDataModules[`./looter/${mode}.js`];
    if (!loadLootData) {
      this.setState({ icons: iconClone });
      return;
    }

    loadLootData().then(async (datax) => {
      let data = JSON.parse(JSON.stringify(datax)).data;
      let promiseArray = [];
      for (let i = 0; i < data.items.length; i++) {
        promiseArray.push(getIcon(data.items[i].name));
      }
      promiseArray.push(getIcon(data.pet.name));
      await Promise.all(promiseArray);
      this.setState({ icons: iconClone });
    });

    function getIcon(name) {
      let searchName = name.includes('+') ? name.replaceAll('+', '%2B') : name;
      return new Promise(async (resolve, reject) => {
        if (!iconClone[name]) {
          try {
            iconClone[name] = 'loading';
            const response = await fetch(
              `https://api.osrsbox.com/items?where={ "name": "${searchName}", "duplicate": false }`
            );
            const data = await response.json();
            iconClone[name] = data._items[0].icon;
            resolve();
          } catch (err) {
            console.log(err);
            resolve();
          }
        }
        resolve();
      });
    }
  }

  async getClueData(type) {
    const response = await fetch(
      `https://oldschool.runescape.wiki/w/Special:Browse?article=Reward_casket_(${type})&format=json`
    );
    const data = await response.json();
    cluesData[type] = data;
  }

  async simulate() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    let num = Number(this.state.rolls);
    if (num > 1000) {
      num = 1000;
    }
    this.setState({ rewardList: [], rewardCount: 0, rewardCountConst: num });
    this.interval = setInterval(async () => {
      let rewards = null;
      if (this.state.rewardCountConst) {
        rewards = await this.lootFunction(num, this.state.mode, this.state);
        this.setState({
          rewardList: [rewards, ...this.state.rewardList],
          rewardCount: this.state.rewardCount + this.state.rewardCountConst,
        });
      }
    }, 2000);
  }

  async go() {
    let rewards = [];
    if (this.state.mode === 'clues') {
      if (!cluesData[this.state.clue]) {
        await this.getClueData(this.state.clue);
      }
    }
    rewards = await this.lootFunction(this.state.rolls, this.state.mode, this.state);
    const requestedRolls = Number(this.state.rolls);
    const rolls =
      Number.isFinite(requestedRolls) && requestedRolls > 0
        ? requestedRolls
        : lastKillCount(rewards);
    const drops = countDrops(rewards);
    const lastSimulation = rolls > 0
      ? {
          rolls,
          drops,
          averageKillsPerDrop: drops ? rolls / drops : null,
          expectedAverageKillsPerDrop: this.state.averageKillsPerDrop,
        }
      : null;
    this.setState({ rewards: rewards, lastSimulation });
    if (this.state.mode === 'create') {
      this.completion(this.state.mode);
    }
    if (rewards && rewards.length === 0) {
      this.setState({ nothingCounter: this.state.nothingCounter + 1 });
    } else {
      this.setState({ nothingCounter: 0 });
    }
  }

  async graphSimulation(skipGraph = false) {
    let killCounts = [];
    this.setState({
      progress: 0,
      bestRewards: null,
      worstRewards: null,
      simulationPlot: null,
    });

    if (this.state.mode === 'clues' && !cluesData[this.state.clue]) {
      await this.getClueData(this.state.clue);
    }

    const simulations = Math.max(0, Number(this.state.simulations) || 0);
    if (!simulations) {
      this.setState({
        progress: 0,
        bestRewards: null,
        worstRewards: null,
        simulationPlot: null,
      });
      return;
    }

    const progressStep = Math.max(1, Math.floor(simulations / 100));
    let best;
    let worst;
    let bestKillCount = Infinity;
    let worstKillCount = -Infinity;

    for (let i = 0; i < simulations; i++) {
      if (i % progressStep == 0) {
        let progress = Math.round((i / simulations) * 100);
        this.setState({ progress });
        await pause();
      }
      let x = await this.lootFunction('f', this.state.mode, this.state);
      const finishKillCount = lastKillCount(x);
      if (!skipGraph) {
        killCounts.push(finishKillCount);
      }
      if (!best || finishKillCount < bestKillCount) {
        best = x;
        bestKillCount = finishKillCount;
      }
      if (!worst || finishKillCount > worstKillCount) {
        worst = x;
        worstKillCount = finishKillCount;
      }
    }

    const simulationPlot = skipGraph ? null : buildSimulationPlot(killCounts);
    this.setState(
      {
        progress: 100,
        bestRewards: best,
        worstRewards: worst,
        simulationPlot,
        plotMode: 'chance',
      },
      () => {
        if (!skipGraph && simulationPlot) {
          this.renderSimulationPlot();
        }
      }
    );
  }

  async componentDidMount() {
    const filenames = Object.keys(imageModules).map((path) => path.split('/').pop());
    this.setState({ availableItems: filenames });
    this.completion();
  }

  lootFunction(rolls, place, options) {
    let num = Number(rolls);
    if (num && rolls) {
      return loot(num, place, { ...options, cluesData });
    } else if (num === 0) {
      return loot('f', place, { ...options, cluesData });
    } else {
      return loot(rolls, place, { ...options, cluesData });
    }
  }

  async completion(mode) {
    const selectedMode = mode || this.state.mode;
    const [completion, averageKillsPerDrop] = await Promise.all([
      loot(null, selectedMode, { ...this.state, runCompletion: true }),
      loot(null, selectedMode, { ...this.state, runDropRate: true }),
    ]);
    this.setState({ completion, averageKillsPerDrop });
  }

  imageSrc(name) {
    name = this.state.availableItems.includes(name)
      ? assetUrl(name)
      : `https://oldschool.runescape.wiki/images/${name.replaceAll(' ', '_')}`;
    return failedImages.includes(name) ? 'Lumbridge_Guide_icon.png' : name;
  }

  stopInterval() {
    if (this.interval) clearInterval(this.interval);
  }

  componentWillUnmount() {
    this.stopInterval();
  }

  render() {
    const bossModes = [
      { value: 'cox', label: 'Cox' },
      { value: 'tob', label: 'ToB' },
      { value: 'toa', label: 'ToA' },
      { value: 'cg', label: 'Corrupted Gauntlet' },
      { value: 'corp', label: 'Corp' },
      { value: 'pnm', label: "Phosani's Nightmare" },
      { value: 'nex', label: 'Nex' },
      { value: 'zulrah', label: 'Zulrah' },
      { value: 'vorkath', label: 'Vorkath' },
      { value: 'arma', label: 'Arma' },
      { value: 'bandos', label: 'Bandos' },
      { value: 'sara', label: 'Sara' },
      { value: 'zammy', label: 'Zammy' },
      { value: 'duke', label: 'Duke' },
      { value: 'araxxor', label: 'Araxxor' },
      { value: 'yama', label: 'Yama' },
      { value: 'leviathan', label: 'Leviathan' },
      { value: 'vardorvis', label: 'Vardorvis' },
      { value: 'whisperer', label: 'Whisperer' },
      { value: 'create', label: 'Create Your Own Boss' },
      { value: 'clues', label: 'Clues' },
    ];

    return (
      <div className="route-dark-bg" style={{ padding: '20px' }}>
        <div className="box">
          <fieldset className="boss-selector boss-grid" aria-label="Boss mode">
            {bossModes.map((boss) => (
              <label
                key={boss.value}
                className={`boss-chip ${this.state.mode === boss.value ? 'is-active' : ''}`}
              >
                <input
                  type="radio"
                  value={boss.value}
                  name="boss-mode"
                  checked={this.state.mode === boss.value}
                  onChange={this.onChangeValue}
                />
                {boss.label}
              </label>
            ))}
          </fieldset>
          {this.state.mode === 'clues' && (
            <fieldset className="boss-selector boss-grid clue-selector" aria-label="Clue level">
              {cluesLvl.map((clue, i) => (
                <label
                  key={clue}
                  className={`boss-chip ${this.state.clue === cluesLvl[i] ? 'is-active' : ''}`}
                >
                  <input
                    type="radio"
                    value={cluesLvl[i]}
                    name="clue-level"
                    checked={this.state.clue === cluesLvl[i]}
                    onChange={(e) => this.onChangeValueInput('clue', e)}
                  />
                  {capitalizeFirstLetter(clue)}
                </label>
              ))}
            </fieldset>
          )}
          {this.state.mode === 'create' && (
            <div style={{ margin: '30px' }}>
              <div style={{ padding: '10px', margin: '10px 0' }}>
                Use fractions for rate or you will crash the webpage :)
                <br />
                Item names must be spelled exactly how they are on the wiki
                <br />
                <button style={{ margin: '3px' }} onClick={this.saveBoss}>
                  {' '}
                  Save boss{' '}
                </button>
                <button style={{ margin: '3px' }} onClick={this.deleteBoss}>
                  {' '}
                  Delete boss{' '}
                </button>
                &nbsp; Boss name:{' '}
                <input
                  type="text"
                  value={this.state.createData.bossName}
                  onChange={(e) => this.changeCreateData('bossName', e.target.value)}
                />
                &nbsp; Load previous boss:
                <select value="" onChange={(e) => this.selectBoss(e.target.value)}>
                  <option value=""></option>
                  {this.state.bosses.map((boss) => (
                    <option key={boss.bossName} value={boss.bossName}>
                      {boss.bossName}
                    </option>
                  ))}
                </select>
              </div>
              Number of unique items you must obtain. &nbsp;
              <button
                onClick={() => this.changeCreateData('num', this.state.createData.numItems - 1)}
              >
                {' '}
                -{' '}
              </button>
              <span> {this.state.createData.numItems} </span>
              <button
                onClick={() => this.changeCreateData('num', this.state.createData.numItems + 1)}
              >
                {' '}
                +{' '}
              </button>
              {this.state.createData.items.map((item, index) => (
                <div key={index}>
                  Item {index + 1}: Name:{' '}
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => this.changeCreateData('name', e.target.value, index)}
                  />
                  &nbsp; Rate:{' '}
                  <input
                    type="text"
                    value={item.rate}
                    onChange={(e) => this.changeCreateData('rate', e.target.value, index)}
                  />
                </div>
              ))}
              {this.state.pets && (
                <div>
                  Pet: Name:{' '}
                  <input
                    type="text"
                    value={this.state.createData.pet.name}
                    onChange={(e) => this.changeCreateData('petName', e.target.value)}
                  />
                  &nbsp; Rate:{' '}
                  <input
                    type="text"
                    value={this.state.createData.pet.rate}
                    onChange={(e) => this.changeCreateData('petRate', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <label>Number of rolls (f or nothing for completion) </label>
          <input
            type="text"
            value={this.state.rolls}
            onChange={(e) => this.onChangeValueInput('rolls', e)}
          />
          {['nex', 'tob'].includes(this.state.mode) && (
            <span>
              &nbsp; <label>Team size</label>
              <input
                type="text"
                value={this.state.teamSize}
                onChange={(e) => this.onChangeValueInput('teamSize', e)}
              />
            </span>
          )}
          {this.state.mode !== 'clues' && (
            <>
              <br />
              Include pet for completion?{' '}
              <input
                type="checkbox"
                onChange={() => {
                  this.setState({ pets: !this.state.pets });
                  this.clearData();
                }}
                checked={this.state.pets}
              />
              <br />
            </>
          )}
          {this.state.mode === 'cox' && (
            <span>
              <label>Number of cox points per raid </label>
              <input
                type="text"
                value={this.state.points}
                onChange={(e) => this.onChangeValueInput('points', e)}
              />
              &nbsp; Challenge Mode?{' '}
              <input
                type="checkbox"
                onChange={() =>
                  this.setState({
                    cms: !this.state.cms,
                    simulationPlot: null,
                    progress: 0,
                    bestRewards: null,
                    worstRewards: null,
                  })
                }
                checked={this.state.cms}
              />
            </span>
          )}
          {this.state.mode === 'toa' && (
            <span>
              <label>Invocation Level (only accurate for 150-575)</label>
              &nbsp;{' '}
              <input
                type="text"
                value={this.state.invocation}
                onChange={(e) => this.onChangeValueInput('invocation', e)}
              />
            </span>
          )}
          <br />
          <button onClick={this.go}> Go! </button>
          &nbsp; or
          <button style={{ margin: '10px' }} onClick={() => this.simulate()}>
            {' '}
            Simulate daily kc. (must be rolls &lt;= 1000){' '}
          </button>
          {this.state.rewardList.length ? (
            <button style={{ background: '#c90c1c' }} onClick={this.stopInterval}>
              {' '}
              Stop{' '}
            </button>
          ) : null}
          {this.state.completion && (
            <div className="osrs-completion-text">
              Average completion not including pet: {this.state.completion} KC
            </div>
          )}
          {this.state.averageKillsPerDrop && (
            <div className="osrs-completion-text">
              Average kills per drop (expected): 1 drop per{' '}
              {formatNumber(this.state.averageKillsPerDrop)} KC
            </div>
          )}
          {this.state.mode === 'create' && (
            <span> (This will be wrong if your rates are very common) </span>
          )}
          <div className="osrs-sim-row">
            <label> Plot results of a # of simulations </label>
            <input
              type="text"
              value={this.state.simulations}
              onChange={(e) => this.onChangeValueInput('simulations', e)}
            />
            <button onClick={() => this.graphSimulation()}> Plot </button>
            <button onClick={() => this.graphSimulation(true)}> Sim without graph </button>
          </div>
          <div className="items">
            {this.state.rewards
              ? this.state.rewards.map((item, i) => (
                  <div
                    key={i}
                    className="item"
                    onMouseEnter={() => this.hoverHandler(i)}
                    onMouseLeave={() => this.hoverHandler(-1)}
                  >
                    <a
                      href={`https://oldschool.runescape.wiki/w/${item.name.split(' ').join('_')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={this.imageSrc(`${item.name}.png`)}
                        title={item.name}
                        alt={item.name}
                        onError={({ currentTarget }) => {
                          if (failedImages.indexOf(currentTarget.src) === -1) {
                            failedImages.push(currentTarget.src);
                          }
                          currentTarget.onerror = null;
                          currentTarget.src = this.imageSrc('Lumbridge_Guide_icon.png');
                        }}
                      />
                    </a>
                    {this.state.hovering === i && this.state.mode === 'clues'
                      ? `${item.kc}(${item.quantity})`
                      : item.kc}
                  </div>
                ))
              : null}
            {this.state.rewards && this.state.rewards.length === 0
              ? 'Nothing x' + this.state.nothingCounter
              : null}
          </div>
          {this.state.lastSimulation && (
            <SimulationResult simulation={this.state.lastSimulation} />
          )}
        </div>
        {this.state.rewardList.length ? (
          <div className="box">
            Overall KC: {this.state.rewardCount}
            <div className="day">
              {this.state.rewardList.map((day, index) => {
                let date = new Date();
                date.setDate(date.getDate() + this.state.rewardList.length - (index + 1));
                date = date.toLocaleString().split(',')[0];
                return (
                  <div key={index} className="flexCol">
                    {date}
                    <div className="items">
                      {day.length
                        ? day.map((item, j) => (
                            <div key={j} className="item">
                              <a
                                href={`https://oldschool.runescape.wiki/w/${item.name.split(' ').join('_')}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={this.imageSrc(`${item.name}.png`)}
                                  title={item.name}
                                  alt={item.name}
                                />
                              </a>
                              {item.kc} (
                              {this.state.rewardCountConst *
                                (this.state.rewardList.length - index) -
                                (this.state.rewardCountConst - item.kc)}
                              )
                            </div>
                          ))
                        : null}
                    </div>
                    <hr />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {this.state.progress > 0 && (
          <div className="osrs-plot-controls">
            <div className="osrs-progress"> {this.state.progress}% done </div>
            <button
              disabled={!this.state.bestRewards}
              onClick={() => this.showPlotData('best')}
            >
              Show best simulation
            </button>
            <button
              disabled={!this.state.worstRewards}
              onClick={() => this.showPlotData('worst')}
            >
              Show worst simulation
            </button>
            <button onClick={() => this.clearPlots()}> Clear </button>
          </div>
        )}
        {this.state.simulationPlot && (
          <SimulationPlotPanel
            mode={this.state.plotMode}
            onModeChange={this.setPlotMode}
            summary={this.state.simulationPlot.summary}
          />
        )}
      </div>
    );
  }
}

export default Osrs;

const pause = () => new Promise((r) => setTimeout(r, 0));

function countDrops(rewards) {
  return rewards.reduce(
    (total, reward) => total + (reward.isPet || reward.isBonusDrop ? 0 : reward.quantity || 1),
    0
  );
}

function lastKillCount(rewards) {
  return rewards.reduce((lastKill, reward) => Math.max(lastKill, reward.kc || 0), 0);
}

function formatNumber(value) {
  return Number(value.toFixed(2)).toLocaleString();
}

function formatKc(value) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString() : '-';
}

function shouldClearSimulationPlot(state) {
  return ['points', 'teamSize', 'invocation', 'clue', 'simulations'].includes(state);
}

function buildSimulationPlot(killCounts) {
  const sortedKillCounts = killCounts
    .filter((killCount) => Number.isFinite(killCount) && killCount > 0)
    .sort((a, b) => a - b);

  if (!sortedKillCounts.length) {
    return null;
  }

  return {
    killCounts: sortedKillCounts,
    curve: buildChanceCurve(sortedKillCounts),
    summary: summarizeKillCounts(sortedKillCounts),
  };
}

function buildChanceCurve(sortedKillCounts) {
  const x = [0];
  const y = [0];

  sortedKillCounts.forEach((killCount, index) => {
    if (killCount !== sortedKillCounts[index + 1]) {
      x.push(killCount);
      y.push(((index + 1) / sortedKillCounts.length) * 100);
    }
  });

  return { x, y };
}

function summarizeKillCounts(sortedKillCounts) {
  const total = sortedKillCounts.length;
  const average =
    sortedKillCounts.reduce((sum, killCount) => sum + killCount, 0) / total;

  return {
    total,
    min: sortedKillCounts[0],
    median: percentileNearest(sortedKillCounts, 0.5),
    average,
    p90: percentileNearest(sortedKillCounts, 0.9),
    p95: percentileNearest(sortedKillCounts, 0.95),
    max: sortedKillCounts[total - 1],
  };
}

function percentileNearest(sortedValues, percentile) {
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * percentile) - 1)
  );
  return sortedValues[index];
}

function buildSimulationFigure(simulationPlot, plotMode, completion) {
  const theme = getPlotTheme();
  const expectedCompletion = getExpectedCompletion(completion);
  const markerLayer = buildSimulationMarkers(
    simulationPlot.summary,
    expectedCompletion,
    theme
  );
  const xMax = Math.max(simulationPlot.summary.max, expectedCompletion || 0);
  const commonLayout = {
    autosize: true,
    height: 390,
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    plot_bgcolor: hexToRgba(theme.bgDark, 0.62),
    font: {
      color: theme.textNormal,
      family:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    margin: { t: 26, r: 24, b: 56, l: 68 },
    xaxis: {
      title: { text: 'KC' },
      color: theme.textNormal,
      gridcolor: hexToRgba(theme.borderLight, 0.24),
      zeroline: false,
      range: [0, Math.ceil(xMax * 1.04)],
    },
    shapes: markerLayer.shapes,
    annotations: markerLayer.annotations,
  };

  if (plotMode === 'distribution') {
    return {
      data: [
        {
          x: simulationPlot.killCounts,
          type: 'histogram',
          marker: {
            color: hexToRgba(theme.gold, 0.74),
            line: { color: theme.borderDark, width: 1 },
          },
          hovertemplate: '%{x:,.0f} KC<br>%{y} simulations<extra></extra>',
        },
      ],
      layout: {
        ...commonLayout,
        bargap: 0.06,
        hovermode: 'closest',
        yaxis: {
          title: { text: 'Simulations' },
          color: theme.textNormal,
          gridcolor: hexToRgba(theme.borderLight, 0.2),
          zeroline: false,
        },
      },
      config: plotConfig,
    };
  }

  return {
    data: [
      {
        x: simulationPlot.curve.x,
        y: simulationPlot.curve.y,
        mode: 'lines',
        type: 'scatter',
        line: {
          color: theme.gold,
          width: 3,
          shape: 'hv',
        },
        fill: 'tozeroy',
        fillcolor: hexToRgba(theme.gold, 0.15),
        hovertemplate: '%{x:,.0f} KC<br>%{y:.1f}% complete<extra></extra>',
      },
    ],
    layout: {
      ...commonLayout,
      hovermode: 'x unified',
      yaxis: {
        title: { text: 'Chance completed' },
        color: theme.textNormal,
        gridcolor: hexToRgba(theme.borderLight, 0.2),
        ticksuffix: '%',
        range: [0, 100],
        zeroline: false,
      },
    },
    config: plotConfig,
  };
}

const plotConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
};

function getPlotTheme() {
  const styles = getComputedStyle(document.documentElement);
  const token = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

  return {
    bgDark: token('--osrs-bg-brown-dark', '#2b261e'),
    borderDark: token('--osrs-border-dark', '#1d1813'),
    borderLight: token('--osrs-border-light', '#5d503f'),
    gold: token('--osrs-text-gold', '#ff981f'),
    textYellow: token('--osrs-text-yellow', '#ffff00'),
    textNormal: token('--osrs-text-normal', '#dbceb4'),
    textSuccess: token('--osrs-text-success', '#9fc77c'),
    textDanger: token('--osrs-text-danger', '#d99890'),
  };
}

function getExpectedCompletion(completion) {
  return typeof completion === 'number' && Number.isFinite(completion) && completion > 0
    ? completion
    : null;
}

function buildSimulationMarkers(summary, expectedCompletion, theme) {
  const markers = [
    { label: 'Median', value: summary.median, color: theme.textYellow, dash: 'dot' },
    { label: '90%', value: summary.p90, color: theme.textSuccess, dash: 'dash' },
    { label: '95%', value: summary.p95, color: theme.textDanger, dash: 'dash' },
  ];

  if (expectedCompletion) {
    markers.unshift({
      label: 'Expected',
      value: expectedCompletion,
      color: theme.textNormal,
      dash: 'longdash',
    });
  }

  return {
    shapes: markers.map((marker) => ({
      type: 'line',
      xref: 'x',
      yref: 'paper',
      x0: marker.value,
      x1: marker.value,
      y0: 0,
      y1: 1,
      line: {
        color: marker.color,
        width: 1.4,
        dash: marker.dash,
      },
    })),
    annotations: markers.map((marker, index) => ({
      x: marker.value,
      y: 1 - (index % 2) * 0.1,
      xref: 'x',
      yref: 'paper',
      text: marker.label,
      showarrow: false,
      yanchor: 'bottom',
      font: { color: marker.color, size: 11 },
      bgcolor: hexToRgba(theme.bgDark, 0.82),
      bordercolor: marker.color,
      borderpad: 3,
      borderwidth: 1,
    })),
  };
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '').trim();

  if (normalized.length !== 6) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function SimulationPlotPanel({ mode, onModeChange, summary }) {
  const stats = [
    { label: 'Best run', value: `${formatKc(summary.min)} KC` },
    { label: 'Median', value: `${formatKc(summary.median)} KC` },
    { label: 'Average', value: `${formatKc(summary.average)} KC` },
    { label: '90% done', value: `${formatKc(summary.p90)} KC` },
    { label: '95% done', value: `${formatKc(summary.p95)} KC` },
    { label: 'Worst run', value: `${formatKc(summary.max)} KC` },
  ];

  return (
    <section className="osrs-simulation-panel" aria-label="Simulation odds">
      <div className="osrs-simulation-panel-header">
        <div>
          <h3 className="osrs-simulation-title">Completion odds</h3>
          <p className="osrs-simulation-meta">
            {summary.total.toLocaleString()} simulated runs
          </p>
        </div>
        <div className="osrs-chart-tabs" role="tablist" aria-label="Simulation chart view">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'chance'}
            className={`osrs-chart-tab ${mode === 'chance' ? 'is-active' : ''}`}
            onClick={() => onModeChange('chance')}
          >
            Chance curve
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'distribution'}
            className={`osrs-chart-tab ${mode === 'distribution' ? 'is-active' : ''}`}
            onClick={() => onModeChange('distribution')}
          >
            Distribution
          </button>
        </div>
      </div>
      <dl className="osrs-simulation-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="osrs-simulation-stat">
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="osrs-chart-shell">
        <div id="simulation-chart" />
      </div>
    </section>
  );
}

function SimulationResult({ simulation }) {
  const { rolls, drops, averageKillsPerDrop } = simulation;
  const comparison = getSimulationComparison(simulation);

  if (!drops) {
    return (
      <div className="osrs-simulation-result">
        This simulation: no regular drops in {rolls} KC.
      </div>
    );
  }

  return (
    <div className="osrs-simulation-result">
      This simulation:{' '}
      <span className={`osrs-simulation-rate ${comparison?.tone || ''}`}>
        1 drop per {formatNumber(averageKillsPerDrop)} KC
      </span>{' '}
      ({drops} {drops === 1 ? 'drop' : 'drops'} in {rolls} KC
      {comparison && (
        <>
          ,{' '}
          <span className={`osrs-simulation-comparison ${comparison.tone}`}>
            {formatNumber(comparison.percentage)}% {comparison.label} than expected
          </span>
        </>
      )}
      )
    </div>
  );
}

function getSimulationComparison({
  drops,
  averageKillsPerDrop,
  expectedAverageKillsPerDrop,
}) {
  if (!drops || !Number.isFinite(expectedAverageKillsPerDrop) || !expectedAverageKillsPerDrop) {
    return null;
  }

  const percentage =
    ((expectedAverageKillsPerDrop - averageKillsPerDrop) / expectedAverageKillsPerDrop) * 100;

  if (Math.abs(percentage) < 0.01) {
    return null;
  }

  return {
    percentage: Math.abs(percentage),
    label: percentage > 0 ? 'better' : 'worse',
    tone: percentage > 0 ? 'is-better' : 'is-worse',
  };
}
