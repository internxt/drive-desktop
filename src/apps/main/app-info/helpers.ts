import { app } from 'electron';
import path from 'path';
import { clearDirectory } from '../virtual-root-folder/service';

const getTempFolder = (): string => {
    return app.getPath('temp');
};

export const getInxtTempFolder = (): string => {
    return path.join(getTempFolder(), 'internxt');
};

export const clearTempFolder = (): Promise<boolean> => {
    const tempFolder = getInxtTempFolder();

    return clearDirectory(tempFolder);
};
