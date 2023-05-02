import { ipcMain } from 'electron';

import { sendReport } from './service';

ipcMain.handle('send-report', (_, report) => sendReport(report));
