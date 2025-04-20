import { ipcMain } from 'electron';
import { buildUsageService } from './serviceBuilder';
import { UserUsageService } from './service';

let service: UserUsageService | null = null;

export function registerUsageHandlers() {
  ipcMain.handle('get-usage', () => {
    if (!service) {
      service = buildUsageService();
    }
    return service.calculateUsage();
  });
}
