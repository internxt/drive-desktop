import { ipcMain } from 'electron';
import { getAvailableProducts } from '../get-available-products';

export async function isCleanerAvailable(): Promise<boolean> {
  const availableProducts = await getAvailableProducts();
  return Boolean(availableProducts?.cleaner);
}

ipcMain.handle('cleaner:is-available', isCleanerAvailable);
