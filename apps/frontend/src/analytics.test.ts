import { describe, expect, test } from 'vitest';
import { normalizeAnalyticsUrl, normalizeUmamiPayload } from './analytics';

describe('Umami analytics', () => {
  test.each([
    ['https://praynr.com/', '/'],
    ['https://praynr.com/#/osrs', '/osrs'],
    ['https://praynr.com/#/github-pages/lol-beat', '/lol-beat'],
    ['https://praynr.com/#/bingo/create', '/bingo/create'],
    ['https://praynr.com/#/bingo/join', '/bingo/join'],
    ['https://praynr.com/bingo/create?ref=discord', '/bingo/create'],
    ['https://praynr.com/bingo/play', '/bingo/play'],
    ['https://praynr.com/kc-trackers/track', '/kc-trackers/track'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeAnalyticsUrl(input)).toBe(expected);
  });

  test('redacts dynamic board names and hash query strings', () => {
    expect(normalizeAnalyticsUrl('https://praynr.com/#/bingo/private-board?password=secret')).toBe(
      '/bingo/:boardName'
    );
  });

  test('preserves payload fields while normalizing its URL', () => {
    expect(
      normalizeUmamiPayload('event', {
        website: 'website-id',
        url: 'https://praynr.com/#/pets?ref=discord',
      })
    ).toEqual({
      website: 'website-id',
      url: '/pets',
    });
  });

  test.each([
    'https://praynr.com/bingo/board/private-board?password=secret',
    'https://praynr.com/bingo/board?boardName=..&password=secret',
    'https://praynr.com/github-pages/bingo/board/private-board/?password=secret',
  ])('redacts board identity and access parameters from %s', (url) => {
    expect(normalizeAnalyticsUrl(url)).toBe('/bingo/:boardName');
  });
});
