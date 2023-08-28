import { homedir } from 'os';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { DependencyContainerFactory } from '../../workers/webdav/dependencyInjection/DependencyContainerFactory';
import { BindingsManager } from '../../workers/webdav/BindingManager';
import PackageJson from '../../../package.json';
import { VirtualDrive } from 'virtual-drive/dist';
import eventBus from '../event-bus';
import { startRemoteSync } from '../remote-sync/handlers';

function getVirtualDrivePath() {
  return homedir() + '\\InternxtDrive';
}

function getOrCreateRootFolder() {
  const virtuaDrivePath = getVirtualDrivePath();
  if (!existsSync(virtuaDrivePath)) {
    fs.mkdir(virtuaDrivePath);
  }

  return virtuaDrivePath;
}

export async function setUp() {
  const containerFactory = new DependencyContainerFactory();
  const container = await containerFactory.build();

  // container.eventBus.addSubscribers(DomainEventSubscribers.from(container));

  // TODO: move setup root folder to main menu
  const virtuaDrivePath = getOrCreateRootFolder();

  const virtualDrive = new VirtualDrive(virtuaDrivePath);

  const bindingsManager = new BindingsManager(
    virtualDrive,
    container,
    virtuaDrivePath
  );

  eventBus.on('RECEIVED_REMOTE_CHANGES', () => {
    startRemoteSync();
    bindingsManager.listFiles();
  });

  // ipc.on('STOP_VIRTUAL_DRIVE_PROCESS', async (event) => {
  //   await bindingsManager.stop();
  //   event.sender.send('WEBDAV_SERVER_STOP_SUCCESS');
  // });

  // bindingsManager.start(
  //   PackageJson.version,
  //   '{12345678-1234-1234-1234-123456789012}'
  // );

  return bindingsManager;
}

// ipc.on('RETRY_VIRTUAL_DRIVE_MOUNT', () => {
//   getOrCreateRootFolder();
// });

// ipc.on('START_VIRTUAL_DRIVE_PROCESS', () => {
//   setUp();
// });