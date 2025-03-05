import Logger from 'electron-log';
import electron from 'electron';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import packageJson from '../../../package.json';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import { iconPath } from '../utils/icon';
import { setConfig, Config, getConfig } from './config';
import { FetchWorkspacesService } from '../main/remote-sync/workspace/fetch-workspaces.service';
import { customInspect } from '../shared/logger/custom-inspect';

Logger.log('==============================', customInspect(electron));
Logger.log(`Running sync engine ${packageJson.version}`);

// process.parentPort.on('message', (e) => {
//   Logger.log('===========================', e);
//   process.parentPort.postMessage('Received');
// });

process.on('message', (e) => {
  process.send?.({ reply: 'Using child_process' });
});

// async function ensureTheFolderExist(path: string) {
//   try {
//     await fs.access(path);
//   } catch {
//     Logger.info(`Folder <${path}> does not exists, going to  create it`);
//     await fs.mkdir(path);
//   }
// }

// async function setUp() {
//   Logger.info('[SYNC ENGINE] Starting sync engine process');

//   const { rootPath, providerName } = getConfig();

//   Logger.info('[SYNC ENGINE] Going to use root folder: ', rootPath);

//   await ensureTheFolderExist(rootPath);

//   const factory = new DependencyContainerFactory();

//   const container = await factory.build();

//   const bindings = new BindingsManager(
//     container,
//     {
//       root: rootPath,
//       icon: iconPath,
//     },
//     providerName,
//   );

//   ipcMain.on('USER_LOGGED_OUT', async () => {
//     bindings.cleanQueue();
//   });

//   ipcMain.on('CHECK_SYNC_ENGINE_RESPONSE', async (event) => {
//     Logger.info('[SYNC ENGINE] Checking sync engine response');
//     const placeholderStatuses = await container.filesCheckerStatusInRoot.run();
//     const placeholderStates = placeholderStatuses;
//   });

//   ipcMain.on('UPDATE_SYNC_ENGINE_PROCESS', async () => {
//     Logger.info('[SYNC ENGINE] Updating sync engine');
//     await bindings.update();
//     Logger.info('[SYNC ENGINE] sync engine updated successfully');
//   });

//   ipcMain.on('FALLBACK_SYNC_ENGINE_PROCESS', async () => {
//     Logger.info('[SYNC ENGINE] Fallback sync engine');

//     await bindings.polling();

//     Logger.info('[SYNC ENGINE] sync engine fallback successfully');
//   });

//   ipcMain.on('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE_PROCESS', async (event) => {
//     Logger.info('[SYNC ENGINE] updating file unsync');

//     const filesPending = await bindings.getFileInSyncPending();
//   });

//   ipcMain.on('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', async (event) => {
//     Logger.info('[SYNC ENGINE] Stopping and clearing sync engine');

//     try {
//       await bindings.stop();
//       await bindings.cleanUp();

//       Logger.info('[SYNC ENGINE] sync engine stopped and cleared successfully');
//     } catch (error: unknown) {
//       Logger.error('[SYNC ENGINE] Error stopping and cleaning: ', error);
//     }
//   });

//   await bindings.start(packageJson.version);

//   await bindings.watch();

//   Logger.info('[SYNC ENGINE] Second sync engine started');

//   ipcMain.emit('CHECK_SYNC');
// }

// async function refreshToken() {
//   try {
//     Logger.info('[SYNC ENGINE] Refreshing token');
//     const credential = await FetchWorkspacesService.getCredencials(getConfig().workspaceId);
//     const newToken = credential.tokenHeader;
//     setConfig({ ...getConfig(), workspaceToken: newToken });
//   } catch (exc) {
//     Logger.error('[SYNC ENGINE] Error refreshing token', exc);
//   }
// }

// ipcMain.once('SET_CONFIG', (event, config: Config) => {
//   setConfig(config);

//   if (config.workspaceToken) {
//     setInterval(refreshToken, 23 * 60 * 60 * 1000);
//   }

//   setUp()
//     .then(() => {
//       Logger.info('[SYNC ENGINE] Sync engine has successfully started');
//       ipcMain.emit('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', config.workspaceId);
//     })
//     .catch((error) => {
//       Logger.error('[SYNC ENGINE] Error setting up', error);
//       if (error.toString().includes('Error: ConnectSyncRoot failed')) {
//         Logger.info('[SYNC ENGINE] We need to restart the app virtual drive');
//       }
//       ipcMain.emit('SYNC_ENGINE_PROCESS_SETUP_FAILED', config.workspaceId);
//     });
// });
