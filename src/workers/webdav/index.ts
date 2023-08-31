import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { VirtualDrive } from 'virtual-drive/dist';

async function setUp() {
  try {
    Logger.debug('STARTING SYNC ENGINE PROCESS');

    const virtualDrivePath = await ipcRenderer.invoke('get-virtual-drive-root');

    Logger.info('WATCHING ON PATH: ', virtualDrivePath);

    const virtualDrive = new VirtualDrive(virtualDrivePath);

    ipcRenderer.on('STOP_SYNC_ENGINE_PROCESS', async (event) => {
      await virtualDrive.unregisterSyncRoot();

      event.sender.send('SYNC_ENGINE_STOP_SUCCESS');
    });
  } catch (error) {
    Logger.debug('ERROR ON SETTING UP', error);
  }
}

setUp().catch((err) => {
  Logger.error(err);
});
