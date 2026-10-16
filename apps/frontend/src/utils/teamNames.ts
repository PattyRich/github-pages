import { DEFAULT_BOARD_TYPE, type BoardType } from '../types';

const adjectives = [
  'Lucky',
  'Sleepy',
  'Gilded',
  'Mighty',
  'Cheeky',
  'Swift',
  'Fearless',
  'Wandering',
  'Golden',
  'Moonlit',
  'Daring',
  'Jolly',
  'Sneaky',
  'Hungry',
  'Grumpy',
  'Nimble',
  'Rowdy',
  'Merry',
  'Plucky',
  'Dapper',
  'Cosmic',
  'Mystic',
  'Salty',
  'Humble',
];

const nouns: Record<BoardType, readonly string[]> = {
  osrs: [
    'Goblins',
    'Scapers',
    'Lobsters',
    'Gnomes',
    'Chinchompas',
    'Imps',
    'Dragons',
    'Dwarves',
    'Wizards',
    'Knights',
    'Raiders',
    'Slayers',
    'Skillers',
    'Bankstanders',
    'Sand Crabs',
    'Rock Crabs',
    'Dagannoths',
    'Hellhounds',
    'Moles',
    'Implings',
  ],
  generic: [
    'Foxes',
    'Owls',
    'Otters',
    'Badgers',
    'Wolves',
    'Ravens',
    'Bears',
    'Falcons',
    'Penguins',
    'Pandas',
    'Tigers',
    'Lions',
    'Geckos',
    'Raccoons',
    'Dolphins',
    'Sparrows',
    'Turtles',
    'Hedgehogs',
    'Koalas',
    'Capybaras',
  ],
};

const combinations = Object.fromEntries(
  Object.entries(nouns).map(([boardType, teamNouns]) => [
    boardType,
    adjectives.flatMap((adjective) => teamNouns.map((noun) => `${adjective} ${noun}`)),
  ])
) as Record<BoardType, string[]>;

/** Include the current name when suggesting a replacement so every click changes it. */
export function suggestTeamName(
  existingNames: readonly string[] = [],
  boardType: BoardType = DEFAULT_BOARD_TYPE
): string {
  const usedNames = new Set(existingNames.map((name) => name.trim().toLowerCase()));
  const candidates = combinations[boardType];
  const available = candidates.filter((name) => !usedNames.has(name.toLowerCase()));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // Keep working for large drafts even after every combination has been used.
  const base = candidates[Math.floor(Math.random() * candidates.length)];
  let suffix = 2;
  while (usedNames.has(`${base} ${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${base} ${suffix}`;
}

export function generateTeamNames(
  count: number,
  boardType: BoardType = DEFAULT_BOARD_TYPE
): string[] {
  const names: string[] = [];
  for (let index = 0; index < count; index += 1) {
    names.push(suggestTeamName(names, boardType));
  }
  return names;
}
