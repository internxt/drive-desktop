import Logger from 'electron-log';
import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { buildUsageService } from './serviceBuilder';
import { UserUsageService } from './service';
import { AccountIpcMain } from '../../shared/IPC/events/account/AccountIpcMain';

let service: UserUsageService | null = null;

function registerUsageHandlers() {
  ipcMain.handle('get-usage', () => {
    if (!service) {
      service = buildUsageService();
    }
    return service.calculateUsage();
  });

  AccountIpcMain.handle('account.get-usage', async () => {
    try {
      if (!service) {
        service = buildUsageService();
      }

      const raw = await service.raw();

      return raw;
    } catch (error) {
      Logger.error('Error getting usage', error);
      throw error;
    }
  });
}

eventBus.on('APP_IS_READY', registerUsageHandlers);

export function getUsageService() {
  if (!service) {
    service = buildUsageService();
  }

  return service;
}
