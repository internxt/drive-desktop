import 'reflect-metadata';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import 'dotenv/config';

import { PATHS } from '../../core/electron/paths';
import { setupElectronLog } from '@internxt/drive-desktop-core/build/backend';
import { setupAppLogRouting } from './logging/setup-app-log-routing';

setupElectronLog({ logsPath: PATHS.LOGS });
setupAppLogRouting({ logsPath: PATHS.LOGS });

// Side-effect handlers registration.
import './virtual-root-folder/handlers';
import '../../core/auto-launch/handlers';
import './auth/handlers';
import './windows/settings';
import './windows/process-issues';
import './issues/virtual-drive';
import '../../backend/features/backup/ipc/device-ipc-handlers';
import './../../backend/features/usage/handlers/handlers';
import './realtime';
import './tray/handlers';
import './fordwardToWindows';
import './analytics/handlers';
import './platform/handlers';
import './config/handlers';
import './app-info/handlers';
import './remote-sync/handlers';
import './../../backend/features/cleaner/ipc/handlers';

import { app } from 'electron';
import { registerAuthIPCHandlers } from '../../infra/ipc/auth-ipc-handlers';
import { registerQuitHandler } from '../../core/quit/quit.handler';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { version, release } from 'node:os';
import { INTERNXT_VERSION } from '../../core/utils/utils';
import { bootstrapMainProcess } from '../../core/bootstrap/main-process-bootstrap';
import { registerVirtualDriveHandlers } from '../../backend/features/virtual-drive/ipc/handlers';

const gotTheLock = app.requestSingleInstanceLock();
app.setAsDefaultProtocolClient('internxt');

if (!gotTheLock) {
  app.quit();
}

registerAuthIPCHandlers();
registerQuitHandler();
registerVirtualDriveHandlers();

logger.debug({
  msg: 'Starting app',
  version: INTERNXT_VERSION,
  isPackaged: app.isPackaged,
  osVersion: version(),
  osRelease: release(),
});

bootstrapMainProcess();
