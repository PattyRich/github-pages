// @vitest-environment node
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const source = readFileSync(
  new URL('../../../public/glass-kc/loot-wall.js', import.meta.url),
  'utf8'
);
const browsers = [];
const stamp = 1780000000000;
const drop = (label, bossId, kc, savedAt) => ({
  label,
  bossId,
  bossName: { cox: 'Chambers of Xeric', pnm: 'Phosani’s Nightmare', yama: 'Yama' }[bossId],
  bossShortName: bossId.toUpperCase(),
  kc,
  tile: kc,
  savedAt,
  image: '',
  windowIndex: 0,
  windowTitle: 'Window one',
});

function open(drops) {
  const dom = new JSDOM('<div id="wall"></div>', { runScripts: 'dangerously' });
  browsers.push(dom);
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.eval(source);
  const wall = dom.window.document.getElementById('wall');
  const onOpenMemory = vi.fn();
  dom.window.createGlassLootWall(wall, { getDrops: () => drops, onOpenMemory });
  const change = (selector, value) => {
    const element = wall.querySelector(selector);
    element.value = value;
    element.dispatchEvent(new dom.window.Event('change'));
  };
  return {
    wall,
    change,
    onOpenMemory,
    titles: () => [...wall.querySelectorAll('.glass-loot-name')].map((node) => node.textContent),
  };
}

afterEach(() => browsers.splice(0).forEach((dom) => dom.window.close()));

describe('loot trophy wall ordering', () => {
  const drops = () => [
    drop('Old Chambers drop', 'cox', 1500, stamp),
    drop('Nightmare drop', 'pnm', 2500, stamp + 1000),
    drop('Yama drop', 'yama', 10, stamp + 2000),
    drop('New Chambers drop', 'cox', 900, stamp + 3000),
    drop('Undated Yama drop', 'yama', 100),
  ];

  it('orders across bosses by saved time and opens the correct sorted memory', () => {
    const { wall, titles, onOpenMemory } = open(drops());
    expect(wall.querySelector('select[id$="-order"]').value).toBe('recent');
    expect(titles()).toEqual([
      'New Chambers drop',
      'Yama drop',
      'Nightmare drop',
      'Old Chambers drop',
      'Undated Yama drop',
    ]);
    expect(wall.querySelector('.glass-loot-date-help').hidden).toBe(false);
    wall.querySelector('[data-loot-window="0"]').click();
    expect(onOpenMemory).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'New Chambers drop', kc: 900 })
    );
  });

  it('keeps undated drops last in oldest-first order and filters across the date order', () => {
    const { wall, change, titles } = open(drops());
    change('select[id$="-order"]', 'oldest');
    expect(titles()).toEqual([
      'Old Chambers drop',
      'Nightmare drop',
      'Yama drop',
      'New Chambers drop',
      'Undated Yama drop',
    ]);
    change('select[id$="-boss"]', 'cox');
    expect(titles()).toEqual(['Old Chambers drop', 'New Chambers drop']);
    expect(wall.querySelector('.glass-loot-date-help').hidden).toBe(true);
  });

  it('compares KC only within each boss for the optional KC orders', () => {
    const { wall, change, titles } = open(drops());
    change('select[id$="-order"]', 'latest');
    expect(titles()).toEqual([
      'Old Chambers drop',
      'New Chambers drop',
      'Nightmare drop',
      'Undated Yama drop',
      'Yama drop',
    ]);
    expect(wall.querySelector('.glass-loot-date-help').hidden).toBe(true);
    change('select[id$="-order"]', 'earliest');
    expect(titles()).toEqual([
      'New Chambers drop',
      'Old Chambers drop',
      'Nightmare drop',
      'Yama drop',
      'Undated Yama drop',
    ]);
  });

  it('sorts before paging so the newest 24 drops are on the first page', () => {
    const entries = Array.from({ length: 25 }, (_, i) =>
      drop(`Drop ${i + 1}`, i % 2 ? 'cox' : 'yama', 1000 - i, stamp + i)
    );
    const { wall, titles } = open(entries);
    expect(titles()).toHaveLength(24);
    expect(titles()[0]).toBe('Drop 25');
    expect(titles()[23]).toBe('Drop 2');
    wall.querySelector('[data-loot-page="next"]').click();
    expect(titles()).toEqual(['Drop 1']);
  });
});
