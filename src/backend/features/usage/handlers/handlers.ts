import { AccountIpcMain } from './../../../../apps/shared/IPC/events/account/AccountIpcMain';
import { ipcMain } from 'electron';
import eventBus from  '../../../../apps/main/event-bus';
import { UsageModule } from '../usage.module';

function registerUsageHandlers() {
  ipcMain.handle('get-usage', () => {
    return UsageModule.calculateUsage();
  });

  AccountIpcMain.handle('account.get-usage', async () => {
    return UsageModule.getRawUsageAndLimit();
  });
}

eventBus.on('APP_IS_READY', registerUsageHandlers);
