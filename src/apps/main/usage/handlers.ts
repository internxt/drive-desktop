import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { buildUsageService } from './serviceBuilder';

function regiterUsageHandlers() {
  ipcMain.handle('get-usage', () => {
    const service = buildUsageService();
    return service.calculateUsage();
  });
}

eventBus.on('APP_IS_READY', regiterUsageHandlers);
