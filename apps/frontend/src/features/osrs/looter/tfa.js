// Team purple rates, updated 11 November 2026:
// https://secure.runescape.com/m=news/quest-month-week-two--tfa-changes?oldschool=1
const purpleDenominators = [16, 16, 12.5, 10.5, 9.5, 8.5, 8, 7.5];

export function getTfaRates(teamSize = 1) {
  const requestedSize = Number(teamSize);
  const size = Number.isFinite(requestedSize)
    ? Math.max(1, Math.min(8, Math.floor(requestedSize)))
    : 1;
  const teamPurpleChance = 1 / purpleDenominators[size - 1];

  // Deathless raids with equal contribution: one recipient per team purple.
  return {
    teamSize: size,
    teamPurpleChance,
    personalPurpleChance: teamPurpleChance / size,
  };
}

// Conditional purple weights and the independent pet roll:
// https://oldschool.runescape.wiki/w/Chest_(The_Fractured_Archive)
// https://secure.runescape.com/m=news/quest-month-kick-off-tfa-tweaks--more?oldschool=1
export const data = {
  name: 'tfa',
  items: [
    { name: 'Rondache', rate: 5 },
    { name: "Zorya's tome (uncharged)", rate: 4 },
    { name: 'Horn of Bran', rate: 3 },
    { name: 'Ascension crossbows', rate: 2 },
    { name: 'Obligator (uncharged)', rate: 1 },
  ],
  pet: {
    name: 'Orion',
    rate: 750,
  },
};
