import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { buildUsageService } from './serviceBuilder';

function regiterUsageHandlers() {
  const service = buildUsageService();

  ipcMain.handle('get-usage', service.calculateUsage.bind(service));
}

eventBus.on('APP_IS_READY', regiterUsageHandlers);
