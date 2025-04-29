import { ipcMain } from 'electron';
import { UserUsageService } from './service';

let service: UserUsageService | null = null;

export function registerUsageHandlers() {
  ipcMain.handle('get-usage', () => {
    if (!service) {
      service = new UserUsageService();
    }
    return service.calculateUsage();
  });
}
