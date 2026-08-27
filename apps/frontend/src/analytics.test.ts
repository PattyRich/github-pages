import { describe, expect, test } from 'vitest';
import { normalizeAnalyticsUrl, normalizeUmamiPayload } from './analytics';

describe('Umami analytics', () => {
  test.each([
    ['https://praynr.com/', '/'],
    ['https://praynr.com/#/osrs', '/osrs'],
    ['https://praynr.com/#/github-pages/lol-beat', '/lol-beat'],
    ['https://praynr.com/#/bingo/create', '/bingo/create'],
    ['https://praynr.com/#/bingo/join', '/bingo/join'],
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
});
