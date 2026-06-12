import { beforeEach, describe, expect, test } from 'vitest';
import { addToRecent, getStoredBool, pwUrlBuilder, setStoredBool } from './utils';
import type { PasswordState, RecentBoard } from './utils';

function storedRecentBoards(): RecentBoard[] {
  return JSON.parse(localStorage.getItem('recentBoards') || '[]') as RecentBoard[];
}

beforeEach(() => {
  localStorage.clear();
});

describe('pwUrlBuilder', () => {
  test('builds an admin URL', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilege: 'admin',
    } satisfies PasswordState;

    expect(pwUrlBuilder(state)).toBe('my-board/adminpw/admin');
  });

  test('builds a general URL', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilege: 'general',
    } satisfies PasswordState;

    expect(pwUrlBuilder(state)).toBe('my-board/genpw/general');
  });

  test('falls back to adminPassword when generalPassword is absent', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: '',
      privilege: 'general',
    } satisfies PasswordState;

    expect(pwUrlBuilder(state)).toBe('my-board/adminpw/general');
  });

  test('appends team password when teamPasswordsRequired is set', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilege: 'general',
      teamPasswordsRequired: true,
    } satisfies PasswordState;

    expect(pwUrlBuilder(state, 'teampw')).toBe('my-board/genpw/general/teampw');
  });

  test('does not append team password when teamPasswordsRequired is false', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilege: 'general',
      teamPasswordsRequired: false,
    } satisfies PasswordState;

    expect(pwUrlBuilder(state, 'teampw')).toBe('my-board/genpw/general');
  });

  test('accepts legacy privilage key on board state', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilage: 'admin',
    } satisfies PasswordState;

    expect(pwUrlBuilder(state)).toBe('my-board/adminpw/admin');
  });

  test('percent-encodes special characters in board name and passwords', () => {
    const state = {
      boardName: 'board name',
      adminPassword: 'p@ss/word',
      generalPassword: 'gen pw',
      privilege: 'admin',
    } satisfies PasswordState;

    expect(pwUrlBuilder(state)).toBe('board%20name/p%40ss%2Fword/admin');
  });
});

describe('addToRecent', () => {
  test('adds a new board to an empty list', () => {
    addToRecent('board-1', 'pw', 'general');

    const stored = storedRecentBoards();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({ boardName: 'board-1', password: 'pw', privilege: 'general' });
  });

  test('does not add a duplicate entry for the same board + privilege', () => {
    addToRecent('board-1', 'pw', 'general');
    addToRecent('board-1', 'pw', 'general');

    expect(storedRecentBoards()).toHaveLength(1);
  });

  test('adds separate entries for the same board with different privileges', () => {
    addToRecent('board-1', 'adminpw', 'admin');
    addToRecent('board-1', 'genpw', 'general');

    expect(storedRecentBoards()).toHaveLength(2);
  });

  test('appends to an existing list without clobbering it', () => {
    addToRecent('board-1', 'pw1', 'general');
    addToRecent('board-2', 'pw2', 'admin');

    const stored = storedRecentBoards();
    expect(stored).toHaveLength(2);
    expect(stored.map((board) => board.boardName)).toEqual(['board-1', 'board-2']);
  });

  test('treats legacy priv field as privilege when deduplicating', () => {
    localStorage.setItem(
      'recentBoards',
      JSON.stringify([{ boardName: 'board-1', password: 'pw', priv: 'general' }])
    );

    addToRecent('board-1', 'pw', 'general');

    expect(storedRecentBoards()).toHaveLength(1);
  });

  test('recovers gracefully when localStorage contains corrupt JSON', () => {
    localStorage.setItem('recentBoards', 'not-json{{{');

    expect(() => addToRecent('board-1', 'pw', 'general')).not.toThrow();
  });
});

describe('getStoredBool / setStoredBool', () => {
  test('returns fallback when key is absent', () => {
    expect(getStoredBool('missing')).toBe(false);
    expect(getStoredBool('missing', true)).toBe(true);
  });

  test('reads true correctly', () => {
    localStorage.setItem('flag', 'true');

    expect(getStoredBool('flag')).toBe(true);
  });

  test('reads false correctly', () => {
    localStorage.setItem('flag', 'false');

    expect(getStoredBool('flag')).toBe(false);
  });

  test('setStoredBool persists and is readable', () => {
    setStoredBool('flag', true);
    expect(getStoredBool('flag')).toBe(true);

    setStoredBool('flag', false);
    expect(getStoredBool('flag')).toBe(false);
  });
});
