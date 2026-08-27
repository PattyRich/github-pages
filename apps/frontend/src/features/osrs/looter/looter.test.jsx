import { afterEach, expect, test, vi } from 'vitest';
import { loot } from './looter';

afterEach(() => {
  vi.restoreAllMocks();
});

test('jumps directly to the next unique drop', async () => {
  mockRandom([randomValueForGap(0.1, 5), 0.5, 0.999999]);

  const rewards = await loot(100, 'create', {
    pets: false,
    createData: {
      name: 'test boss',
      items: [{ name: 'Test unique', rate: 0.1 }],
    },
  });

  expect(rewards).toEqual([{ kc: 5, name: 'Test unique' }]);
});

test('processes both Zulrah rolls before advancing to the next kill', async () => {
  mockRandom([0.1, 0.2, 0.1, 0.2, 0.999999]);

  const rewards = await loot(1, 'create', {
    pets: false,
    createData: {
      name: 'zulrah',
      items: [{ name: 'Test unique', rate: 0.5 }],
    },
  });

  expect(rewards).toEqual([
    { kc: 1, name: 'Test unique' },
    { kc: 1, name: 'Test unique' },
  ]);
});

test('merges independent unique and pet event streams in KC order', async () => {
  mockRandom([randomValueForGap(0.5, 2), randomValueForGap(0.25, 4), 0.2, 0.999999, 0.999999]);

  const rewards = await loot('f', 'create', {
    pets: true,
    createData: {
      bossName: 'Custom boss without a data name',
      items: [{ name: 'Test unique', rate: 0.5 }],
      pet: { name: 'Test pet', rate: 4 },
    },
  });

  expect(rewards).toEqual([
    { kc: 2, name: 'Test unique' },
    { kc: 4, name: 'Test pet', isPet: true },
  ]);
});

test('only rolls a CoX pet when a purple occurs', async () => {
  mockRandom([0.2, 0.75]);

  const rewards = await loot(1, 'create', {
    points: 867800,
    pets: true,
    createData: {
      name: 'cox',
      items: [{ name: 'Test purple', rate: 1 }],
      pet: { name: 'Test olmlet', rate: 2 },
    },
  });

  expect(rewards).toEqual([
    { kc: 1, name: 'Test purple' },
    { kc: 1, name: 'Test olmlet', isPet: true },
  ]);
});

test('preserves the CM bonus-drop pet restriction', async () => {
  mockRandom([0.2, 0.2]);

  const rewards = await loot(1, 'create', {
    points: 867800,
    pets: true,
    createData: {
      name: 'cox-cm',
      items: [{ name: 'Test purple', rate: 1 }],
      cms: [{ name: 'Test kit', rate: 1 }],
      pet: { name: 'Test olmlet', rate: 2 },
    },
  });

  expect(rewards).toEqual([
    { kc: 1, name: 'Test purple' },
    { kc: 1, name: 'Test kit', isBonusDrop: true },
  ]);
});

function randomValueForGap(chance, gap) {
  return 1 - Math.pow(1 - chance, gap - 0.5);
}

function mockRandom(values) {
  vi.spyOn(Math, 'random').mockImplementation(() => values.shift() ?? 0.999999);
}
