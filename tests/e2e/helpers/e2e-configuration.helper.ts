export function getE2EPaths() {
  const e2eHomePath = process.env.E2E_HOME_PATH;
  const e2eAppDataPath = process.env.E2E_APPDATA_PATH;

  if (process.env.E2E_TEST === 'true') {
    if (!e2eHomePath) throw new Error('E2E_HOME_PATH env var is not set');
    if (!e2eAppDataPath) throw new Error('E2E_APPDATA_PATH env var is not set');

    return {
      e2eHomePath,
      e2eAppDataPath,
    };
  }
}

export const DEFAULT_TIMEOUT = 60_000;
