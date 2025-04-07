import { app } from 'electron';
import path from 'path';

const getTempFolder = (): string => {
  return app.getPath('temp');
};

export const getInxtTempFolder = (): string => {
  return path.join(getTempFolder(), 'internxt');
};
