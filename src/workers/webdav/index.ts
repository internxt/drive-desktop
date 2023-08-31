import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { BindingsManager } from './BindingManager';
import { DependencyContainerFactory } from './dependencyInjection/DependencyContainerFactory';
import { VirtualDrive } from 'virtual-drive/dist';
import packageJson from '../../../package.json';

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

    const factory = new DependencyContainerFactory();
    const container = await factory.build();

    const bindings = new BindingsManager(
      virtualDrive,
      container,
      virtualDrivePath
    );

    await bindings.start(
      packageJson.version,
      '{12345678-1234-1234-1234-123456789012}'
    );
  } catch (error) {
    Logger.debug('ERROR ON SETTING UP', error);
  }
}

setUp().catch((err) => {
  Logger.error(err);
});
