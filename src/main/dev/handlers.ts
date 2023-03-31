import { ipcMain } from 'electron';
import { resizeCurrentWindow } from './service';

ipcMain.handle('resize-focused-window', (_, v) => resizeCurrentWindow(v));
