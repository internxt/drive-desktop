import { ipcMain } from 'electron';

import { executeQuery } from './service';

ipcMain.handle('execute-app-query', (_, query) => executeQuery(query));
