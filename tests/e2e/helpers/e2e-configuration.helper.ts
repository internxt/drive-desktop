import { app } from 'electron';

function setPlaywrightPaths() {
  const homePath = process.env.E2E_HOME_PATH;
  const appDataPath = process.env.E2E_APPDATA_PATH;
  if (!homePath) throw new Error('E2E_HOME_PATH env var is not set');
  if (!appDataPath) throw new Error('E2E_APPDATA_PATH env var is not set');
  app.setPath('home', homePath);
  app.setPath('appData', appDataPath);
}

export function applyE2EConfiguration() {
  setPlaywrightPaths();
}

export const DEFAULT_TIMEOUT = 30_000;
