import { ipcMain } from 'electron';
import { ConfigFileListingStore } from '../../workers/sync/Listings/infrastructure/ConfigFileListingStore';
import configStore from '../../main/config';

const store = new ConfigFileListingStore(configStore);

ipcMain.on('clear-saved-listing', () => {
  store.removeSavedListing();
});
