import { describe, expect, test } from 'vitest';
import { appRouteForUrl, boardPath, browserRouteTarget } from './routing';

describe('old shared links', () => {
  test.each([
    ['https://praynr.com/#/bingo', '/bingo/play'],
    ['https://praynr.com/#/bingo/', '/bingo/play'],
    ['https://praynr.com/#/glass-kc', '/kc-trackers/track'],
    ['https://praynr.com/#/github-pages/glass-kc', '/kc-trackers/track'],
    ['https://praynr.com/#/bingo/create', '/bingo/create'],
    ['https://praynr.com/#/bingo/join', '/bingo/join'],
    [
      'https://praynr.com/#/bingo/Clan%20Bingo?password=a%26b%2Fc',
      '/bingo/board/Clan%20Bingo?password=a%26b%2Fc',
    ],
    [
      'https://praynr.com/?ref=discord#/github-pages/bingo/clan?password=pw',
      '/bingo/board/clan?password=pw&ref=discord',
    ],
    ['https://praynr.com/#/bingo/play?password=pw', '/bingo/board/play?password=pw'],
    ['https://praynr.com/#/bingo/index.html?password=pw', '/bingo/board/index.html?password=pw'],
    ['https://praynr.com/#/bingo/..?password=pw', '/bingo/board?boardName=..&password=pw'],
    ['https://praynr.com/#/recents?ref=old', '/recents?ref=old'],
    ['https://praynr.com/#/osrs?boss=olm#loot', '/osrs?boss=olm#loot'],
    ['https://praynr.com/#/unknown-tool', '/unknown-tool'],
    ['https://praynr.com/#//example.com', '/'],
  ])('preserves the destination of %s', (input, expected) => {
    expect(appRouteForUrl(new URL(input))).toBe(expected);
  });
});

describe('normal routes and static hosts', () => {
  test.each([
    ['https://praynr.com/bingo/create?ref=discord', '/bingo/create?ref=discord'],
    ['https://praynr.com/bingo/play', '/bingo/play'],
    ['https://praynr.com/bingo/board/clan?password=pw', '/bingo/board/clan?password=pw'],
    ['https://praynr.com/bingo/clan?password=pw', '/bingo/board/clan?password=pw'],
    ['https://praynr.com/osrs#loot', '/osrs#loot'],
    ['https://praynr.com/?ref=discord', '/?ref=discord'],
  ])('keeps %s usable without a hash router', (input, expected) => {
    expect(browserRouteTarget(new URL(input), '/')).toBe(expected);
  });

  test('redirects old GitHub board links to normal production URLs', () => {
    expect(
      browserRouteTarget(
        new URL('https://pattyrich.github.io/github-pages/#/bingo/clan?password=pw'),
        '/github-pages/'
      )
    ).toBe('https://praynr.com/bingo/board/clan?password=pw');
  });

  test.each([
    'https://pattyrich.github.io/github-pages/#/recents',
    'https://pattyrich.github.io/github-pages/#/github-pages/recents',
    'https://pattyrich.github.io/github-pages/recents',
  ])('keeps saved-board storage on its original origin for %s', (input) => {
    expect(browserRouteTarget(new URL(input), '/github-pages/')).toBe('/github-pages/recents');
  });

  test('keeps the project prefix during local GitHub Pages previews', () => {
    expect(
      browserRouteTarget(new URL('http://localhost/github-pages/#/pets'), '/github-pages/')
    ).toBe('/github-pages/pets');
  });

  test.each(['.', '..'])('preserves the board name %s without dot-segment removal', (name) => {
    const path = boardPath(name);
    const url = new URL(path, 'https://praynr.com');
    expect(url.pathname).toBe('/bingo/board');
    expect(url.searchParams.get('boardName')).toBe(name);
  });
});
