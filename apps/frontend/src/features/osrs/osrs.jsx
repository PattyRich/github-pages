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
    });
  };

  async onChangeValue(event) {
    this.setState({ mode: event.target.value, lastSimulation: null });
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
    this.setState({ createData: this.state.bosses[index] });
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
    this.setState({ [state]: event.target.value }, () => {
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

  async clearPlots() {
    const Plotly = await getPlotly();
    Plotly.deleteTraces('histogram', 0);
    Plotly.deleteTraces('scatter', 0);
    this.setState({ bestRewards: null, worstRewards: null });
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
      this.setState({ createData: copy });
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

    this.setState({ createData: copy });
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
    let arr = [];
    let items = [];
    this.setState({ progress: 0, bestRewards: null, worstRewards: null });
    let best, worst;
    for (let i = 0; i < this.state.simulations; i++) {
      if (i % (this.state.simulations / 100) == 0) {
        let progress = Math.round((i / this.state.simulations) * 100);
        this.setState({ progress });
        await pause();
      }
      let x = await this.lootFunction('f', this.state.mode, this.state);
      if (!skipGraph) {
        arr.push(x[x.length - 1].kc);
        items.push(x.length);
      }
      if (!best || x[x.length - 1].kc < best[best.length - 1].kc) {
        best = x;
      }
      if (!worst || x[x.length - 1].kc > worst[worst.length - 1].kc) {
        worst = x;
      }
    }

    this.setState({ progress: 100, bestRewards: best, worstRewards: worst });
    if (skipGraph) {
      return;
    }

    const Plotly = await getPlotly();
    let layout = {
      xaxis: { title: { text: 'KC' } },
      yaxis: { title: { text: '# of people' } },
    };
    Plotly.newPlot('histogram', [{ x: arr, type: 'histogram' }], layout);
    layout.yaxis.title.text = '# of items received';
    Plotly.newPlot('scatter', [{ x: arr, y: items, mode: 'markers', type: 'scatter' }], layout);
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
                onChange={() => this.setState({ cms: !this.state.cms })}
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
          <br />
          <span>
            <label> Plot results of a # of simulations </label>
            <input
              type="text"
              value={this.state.simulations}
              onChange={(e) => this.onChangeValueInput('simulations', e)}
            />
          </span>
          <button onClick={() => this.graphSimulation()}> Plot. </button>
          <button onClick={() => this.graphSimulation(true)}> Sim without graph. </button>
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
          <span>
            <div style={{ marginLeft: '20px' }}> {this.state.progress}% done </div>
            <button style={{ margin: '5px' }} onClick={() => this.showPlotData('best')}>
              {' '}
              Show best simulation.{' '}
            </button>
            <button style={{ margin: '5px' }} onClick={() => this.showPlotData('worst')}>
              {' '}
              Show worst simulation.{' '}
            </button>
            <button style={{ margin: '5px' }} onClick={() => this.clearPlots()}>
              {' '}
              Clear{' '}
            </button>
          </span>
        )}
        <div id="histogram"> </div>
        <div id="scatter"> </div>
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
