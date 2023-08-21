import Logger from 'electron-log';
import { DependencyContainerFactory } from './dependencyInjection/DependencyContainerFactory';
import { ipc } from './ipc';
import { getVirtualDrivePath } from './VirtualDrive';
import { DomainEventSubscribers } from './modules/shared/infrastructure/DomainEventSubscribers';
import { BindingsManager } from './BindingManager';
import PackageJson from '../../../package.json';
import { VirtualDrive } from 'virtual-drive/dist';
import fs from 'fs/promises';

async function setUp() {
  try {
    const containerFactory = new DependencyContainerFactory();
    const container = await containerFactory.build();

    container.eventBus.addSubscribers(DomainEventSubscribers.from(container));

    // TODO: move setup root folder to main menu
    const virtuaDrivePath = getVirtualDrivePath();
    void fs.mkdir(virtuaDrivePath);

    const virtualDrive = new VirtualDrive(virtuaDrivePath);

    const bindingsManager = new BindingsManager(virtualDrive, container);

    ipc.on('STOP_VIRTUAL_DRIVE_PROCESS', async (event) => {
      await bindingsManager.stop();
      event.sender.send('WEBDAV_SERVER_STOP_SUCCESS');
    });

    bindingsManager.start(
      PackageJson.version,
      '{12345678-1234-1234-1234-123456789012}'
    );
  } catch (error) {
    Logger.debug('ERROR ON SETTING UP', error);
  }
}

ipc.on('START_VIRTUAL_DRIVE_PROCESS', () => {
  setUp();
});

setUp().catch((err) => {
  Logger.error(err);
});
