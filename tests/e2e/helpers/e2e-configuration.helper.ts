import { app } from 'electron';

const setPlaywrightPaths = () => {
  app.setPath('home', process.env.PLAYWRIGHT_HOME_PATH!);
  app.setPath('appData', process.env.PLAYWRIGHT_DATA_PATH!);
};

export const applyE2EConfiguration = () => {
  setPlaywrightPaths();
};
