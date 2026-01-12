import { ipcMain } from 'electron';
import eventBus from '../../../../apps/main/event-bus';
import { UsageModule } from '../usage.module';

function registerUsageHandlers() {
  ipcMain.handle('get-usage', () => {
    return UsageModule.calculateUsage();
  });
}

eventBus.on('APP_IS_READY', registerUsageHandlers);
