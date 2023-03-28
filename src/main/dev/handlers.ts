import { ipcMain } from 'electron';
import { ConfigFileListingStore } from '../../workers/sync/Listings/infrastructure/ConfigFileListingStore';
import configStore from '../../main/config';
import Logger from 'electron-log';

const store = new ConfigFileListingStore(configStore);

ipcMain.on('clear-saved-listing', () => {
  Logger.debug('CLEARING SAVED LISTING');
  store.removeSavedListing();
});
