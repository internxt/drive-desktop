import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { VirtualDrive } from 'virtual-drive/dist';

async function setUp() {
  try {
    Logger.debug('STARTING WATHCER PROCESS');

    const virtualDrivePath = await ipcRenderer.invoke('get-virtual-drive-root');

    Logger.info('WATCHING ON PATH: ', virtualDrivePath);

    const virtualDrive = new VirtualDrive(virtualDrivePath);

    virtualDrive.watchAndWait2(virtualDrivePath);
  } catch (error) {
    Logger.debug('ERROR ON SETTING UP', error);
  }
}

setUp().catch((err) => {
  Logger.error(err);
});
