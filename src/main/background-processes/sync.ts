import { app, BrowserWindow, ipcMain, powerSaveBlocker } from 'electron';
import Logger from 'electron-log';
import path from 'path';
import * as uuid from 'uuid';

import { ProcessResult } from '../../workers/process';
import { SyncArgs } from '../../workers/sync';
import { ProcessFatalErrorName, ProcessInfoUpdatePayload } from '../../workers/types';
import { getIsLoggedIn } from '../auth/handlers';
import * as Auth from '../auth/service';
import configStore from '../config';
import eventBus from '../event-bus';
import { clearPendingChanges, getThereArePendingChanges } from '../realtime';
import { getTray } from '../tray';
import { broadcastToWindows } from '../windows';
import { LockError, LockErrorReason } from './lock-erros';
import locksService from './locks-service';
import { clearSyncIssues, getSyncIssues } from './process-issues';

const LOCK_ID = uuid.v4();

export type SyncStatus = 'STANDBY' | 'RUNNING';

let syncStatus: SyncStatus = 'STANDBY';

export function getSyncStatus() {
	return syncStatus;
}

ipcMain.on('start-sync-process', startSyncProcess);
ipcMain.handle('get-sync-status', getSyncStatus);

export function setTraySyncStatus(newStatus: SyncStatus) {
	const tray = getTray();
	if (newStatus === 'RUNNING') {
		tray?.setState('SYNCING');
	} else if (getSyncIssues().length !== 0) {
		tray?.setState('ISSUES');
	} else {
		tray?.setState('STANDBY');
	}
}

function changeSyncStatus(newStatus: SyncStatus) {
	syncStatus = newStatus;
	broadcastToWindows('sync-status-changed', newStatus);
	setTraySyncStatus(newStatus);
}

export async function startSyncProcess() {
	if (syncStatus === 'RUNNING') {
		return;
	}

	const suspensionBlockId = powerSaveBlocker.start('prevent-display-sleep');

	changeSyncStatus('RUNNING');

	clearSyncIssues();

	clearPendingChanges();

	// It's an object to pass it to
	// the individual item processors
	const hasBeenStopped = { value: false };

	ipcMain.once('stop-sync-process', () => {
		hasBeenStopped.value = true;
	});

	const item = {
		folderId: Auth.getUser()?.root_folder_id as number,
		localPath: configStore.get('syncRoot'),
		tmpPath: app.getPath('temp'),
	};
	await processSyncItem(item, hasBeenStopped);

	const currentTimestamp = new Date().valueOf();

	configStore.set('lastSync', currentTimestamp);

	if (getIsLoggedIn() && getThereArePendingChanges() && !hasBeenStopped.value) {
		setImmediate(startSyncProcess);
	}

	changeSyncStatus('STANDBY');

	ipcMain.removeAllListeners('stop-sync-process');

	powerSaveBlocker.stop(suspensionBlockId);
}

export type SyncStoppedPayload =
	| {
			reason: 'STOPPED_BY_USER';
	  }
	| { reason: 'COULD_NOT_ACQUIRE_LOCK'; cause: LockErrorReason }
	| {
			reason: 'FATAL_ERROR';
			errorName: ProcessFatalErrorName;
	  }
	| { reason: 'EXIT'; result: ProcessResult };

function refreshLockEvery(): number {
	const interval = process.env.LOCK_REFRESH_INTERVAL;

	return interval ? parseInt(interval, 10) : 7000;
}

function processSyncItem(item: SyncArgs, hasBeenStopped: { value: boolean }) {
	return new Promise<void>(async (resolve) => {
		const onExitFuncs: ((() => void) | (() => Promise<void>))[] = [];
		let exited = false;

		async function onExit(payload: SyncStoppedPayload) {
			exited = true;
			ipcMain.emit('sync-stopped', payload);
			Logger.log(
				`[onSyncExit] (${payload.reason}) ${
					payload.reason === 'FATAL_ERROR' ? payload.errorName : ''
				} ${payload.reason === 'EXIT' ? payload.result.status : ''}`
			);
			Promise.allSettled(onExitFuncs.map((fn) => fn()));
			broadcastToWindows('sync-stopped', payload);

			resolve();
		}

		function onAcquireLockError(err: any) {
			Logger.log('Could not acquire lock', err);

			const cause = err instanceof LockError ? err.reason : 'UNKNONW_LOCK_SERVICE_ERROR';

			if (!exited) {
				onExit({ reason: 'COULD_NOT_ACQUIRE_LOCK', cause });
			}
		}

		try {
			await locksService.acquireOrRefreshLock(item.folderId, LOCK_ID);

			const lockRefreshInterval = setInterval(() => {
				locksService.acquireOrRefreshLock(item.folderId, LOCK_ID).catch(onAcquireLockError);
			}, refreshLockEvery());
			onExitFuncs.push(() => clearInterval(lockRefreshInterval));

			onExitFuncs.push(() => locksService.releaseLock(item.folderId, LOCK_ID));
		} catch (err: unknown) {
			return onAcquireLockError(err);
		}

		if (hasBeenStopped.value) {
			return onExit({ reason: 'STOPPED_BY_USER' });
		}

		ipcMain.handle('get-sync-details', () => item);
		onExitFuncs.push(() => ipcMain.removeHandler('get-sync-details'));

		ipcMain.once('SYNC_FATAL_ERROR', (_, errorName) =>
			onExit({ reason: 'FATAL_ERROR', errorName })
		);
		onExitFuncs.push(() => ipcMain.removeAllListeners('SYNC_FATAL_ERROR'));

		ipcMain.once('SYNC_EXIT', (_, result) => onExit({ reason: 'EXIT', result }));
		onExitFuncs.push(() => ipcMain.removeAllListeners('SYNC_EXIT'));

		const worker = spawnSyncWorker();
		onExitFuncs.push(() => worker.destroy());

		if (hasBeenStopped.value) {
			return onExit({ reason: 'STOPPED_BY_USER' });
		}

		const onUserStopped = () => onExit({ reason: 'STOPPED_BY_USER' });
		ipcMain.once('stop-sync-process', onUserStopped);
		onExitFuncs.push(() => ipcMain.removeListener('stop-sync-process', onUserStopped));
	});
}

function spawnSyncWorker() {
	const worker = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
		show: false,
	});

	worker
		.loadFile(
			process.env.NODE_ENV === 'development'
				? '../../release/app/dist/sync/index.html'
				: `${path.join(__dirname, '..', 'sync')}/index.html`
		)
		.catch(Logger.error);

	return worker;
}

ipcMain.on('SYNC_INFO_UPDATE', (_, payload: ProcessInfoUpdatePayload) => {
	broadcastToWindows('sync-info-update', payload);
});

eventBus.on('WIDGET_IS_READY', startSyncProcess);

eventBus.on('USER_LOGGED_OUT', () => {
	ipcMain.emit('stop-sync-process');
	setTraySyncStatus('STANDBY');
});

eventBus.on('USER_WAS_UNAUTHORIZED', () => {
	ipcMain.emit('stop-sync-process');
	setTraySyncStatus('STANDBY');
});
