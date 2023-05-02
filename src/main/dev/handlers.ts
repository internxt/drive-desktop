import { ipcMain } from 'electron';

import { addFakeIssues, resizeCurrentWindow } from './service';

ipcMain.handle('resize-focused-window', (_, v) => resizeCurrentWindow(v));

ipcMain.handle('add-fake-sync-issues', (_, v) => addFakeIssues(v));
