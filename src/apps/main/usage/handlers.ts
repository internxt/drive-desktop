import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { buildUsageService } from './serviceBuilder';
import { UserUsageService } from './service';

let service: UserUsageService | null = null;

function regiterUsageHandlers() {
  ipcMain.handle('get-usage', () => {
    if (!service) {
      service = buildUsageService();
    }
    return service.calculateUsage();
  });
}

eventBus.on('APP_IS_READY', regiterUsageHandlers);

export function getUsageService() {
  if (!service) {
    service = buildUsageService();
  }

  return service;
}
