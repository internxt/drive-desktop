import { ipcMain } from 'electron';
import Logger from 'electron-log';
import { ConfigFileListingStore } from '../../workers/sync/Listings/infrastructure/ConfigFileListingStore';
import configStore from '../config';
import { resizeCurrentWindow, addFakeIssues } from './service';

const store = new ConfigFileListingStore(configStore);

ipcMain.on('clear-saved-listing', () => {
  Logger.debug('CLEARING SAVED LISTING');
  store.removeSavedListing();
});

ipcMain.handle('resize-focused-window', (_, v) => resizeCurrentWindow(v));

ipcMain.handle('add-fake-sync-issues', (_, v) => addFakeIssues(v));
