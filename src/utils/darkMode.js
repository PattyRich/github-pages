import {
  enable as enableDarkMode,
  disable as disableDarkMode,
  auto as followSystemColorScheme,
  isEnabled as isDarkReaderEnabled,
  setFetchMethod,
} from 'darkreader';

let fetchMethodConfigured = false;

function configureDarkReaderFetch() {
  if (fetchMethodConfigured || typeof window === 'undefined' || !window.fetch) {
    return;
  }

  setFetchMethod(window.fetch.bind(window));
  fetchMethodConfigured = true;
}

export function enableAppDarkMode() {
  configureDarkReaderFetch();
  enableDarkMode({
    brightness: 100,
    contrast: 90,
    sepia: 10,
  });
}

export function disableAppDarkMode() {
  disableDarkMode();
}

export function followAppSystemColorScheme() {
  configureDarkReaderFetch();
  followSystemColorScheme();
}

export function isAppDarkModeEnabled() {
  return isDarkReaderEnabled();
}
