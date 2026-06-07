import { describe, expect, test, beforeEach } from 'vitest';
import { addToRecent, getStoredBool, pwUrlBuilder, setStoredBool } from './utils';

beforeEach(() => {
  localStorage.clear();
});

// ─── pwUrlBuilder ────────────────────────────────────────────────────────────

describe('pwUrlBuilder', () => {
  test('builds an admin URL', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilage: 'admin',
    };
    expect(pwUrlBuilder(state)).toBe('my-board/adminpw/admin');
  });

  test('builds a general URL', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilage: 'general',
    };
    expect(pwUrlBuilder(state)).toBe('my-board/genpw/general');
  });

  test('falls back to adminPassword when generalPassword is absent', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: '',
      privilage: 'general',
    };
    expect(pwUrlBuilder(state)).toBe('my-board/adminpw/general');
  });

  test('appends team password when teamPasswordsRequired is set', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilage: 'general',
      teamPasswordsRequired: true,
    };
    expect(pwUrlBuilder(state, 'teampw')).toBe('my-board/genpw/general/teampw');
  });

  test('does not append team password when teamPasswordsRequired is false', () => {
    const state = {
      boardName: 'my-board',
      adminPassword: 'adminpw',
      generalPassword: 'genpw',
      privilage: 'general',
      teamPasswordsRequired: false,
    };
    expect(pwUrlBuilder(state, 'teampw')).toBe('my-board/genpw/general');
  });

  test('percent-encodes special characters in board name and passwords', () => {
    const state = {
      boardName: 'board name',
      adminPassword: 'p@ss/word',
      generalPassword: 'gen pw',
      privilage: 'admin',
    };
    expect(pwUrlBuilder(state)).toBe('board%20name/p%40ss%2Fword/admin');
  });
});

// ─── addToRecent ─────────────────────────────────────────────────────────────

describe('addToRecent', () => {
  test('adds a new board to an empty list', () => {
    addToRecent('board-1', 'pw', 'general');
    const stored = JSON.parse(localStorage.getItem('recentBoards'));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({ boardName: 'board-1', password: 'pw', priv: 'general' });
  });

  test('does not add a duplicate entry for the same board + priv', () => {
    addToRecent('board-1', 'pw', 'general');
    addToRecent('board-1', 'pw', 'general');
    const stored = JSON.parse(localStorage.getItem('recentBoards'));
    expect(stored).toHaveLength(1);
  });

  test('adds separate entries for the same board with different privs', () => {
    addToRecent('board-1', 'adminpw', 'admin');
    addToRecent('board-1', 'genpw', 'general');
    const stored = JSON.parse(localStorage.getItem('recentBoards'));
    expect(stored).toHaveLength(2);
  });

  test('appends to an existing list without clobbering it', () => {
    addToRecent('board-1', 'pw1', 'general');
    addToRecent('board-2', 'pw2', 'admin');
    const stored = JSON.parse(localStorage.getItem('recentBoards'));
    expect(stored).toHaveLength(2);
    expect(stored.map((b) => b.boardName)).toEqual(['board-1', 'board-2']);
  });

  test('recovers gracefully when localStorage contains corrupt JSON', () => {
    localStorage.setItem('recentBoards', 'not-json{{{');
    expect(() => addToRecent('board-1', 'pw', 'general')).not.toThrow();
  });
});

// ─── getStoredBool / setStoredBool ───────────────────────────────────────────

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
