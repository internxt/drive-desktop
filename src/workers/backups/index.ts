import { ipcRenderer as electronIpcRenderer } from 'electron';
import Logger from 'electron-log';

import { getUser } from '../../main/auth/service';
import configStore from '../../main/config';
import { getClients } from '../../shared/HttpClient/backgroud-process-clients';
import { getLocalFilesystem } from '../filesystems/local-filesystem';
import { getRemoteFilesystem } from '../filesystems/remote-filesystem';
import { ProcessFatalError, ProcessFatalErrorName, ProcessIssue } from '../types';
import Backups from './backups';

export type BackupsArgs = {
	folderId: number;
	path: string;
	tmpPath: string;
	backupsBucket: string;
};

export type BackupProgressIssue = ProcessIssue & {
	folderId: number;
};

export interface BackupsEvents {
	BACKUP_FATAL_ERROR: (folderId: number, errorName: ProcessFatalErrorName) => void;
	BACKUP_PROGRESS: (payload: { completedItems: number; totalItems: number }) => void;
	BACKUP_ISSUE: (issue: BackupProgressIssue) => void;
	BACKUP_EXIT: (folderId: number) => void;
	BACKUP_ACTION_DONE: () => void;
	BACKUP_ACTION_QUEUE_GENERATED: ({ folderId, items }: { folderId: number; items: number }) => void;
}

interface IpcRenderer {
	send<U extends keyof BackupsEvents>(event: U, ...args: Parameters<BackupsEvents[U]>): void;
	invoke(channel: 'get-backups-details'): Promise<BackupsArgs>;
	invoke(channel: 'get-headers'): Promise<HeadersInit>;
}

const ipcRenderer = electronIpcRenderer as IpcRenderer;

let completedItems = 0;
let totalItems = 0;

function onCompletedItem() {
	completedItems++;
	ipcRenderer.send('BACKUP_PROGRESS', { completedItems, totalItems });
}

async function setUp() {
	const { tmpPath, path, folderId, backupsBucket } = await ipcRenderer.invoke(
		'get-backups-details'
	);
	const headers = await ipcRenderer.invoke('get-headers');
	const user = getUser();

	if (!user) {
		throw new Error('No user');
	}

	const clients = getClients();

	const remote = getRemoteFilesystem({
		baseFolderId: folderId,
		headers,
		bucket: backupsBucket,
		mnemonic: configStore.get('mnemonic'),
		userInfo: user,
		clients,
	});
	const local = getLocalFilesystem(path, tmpPath);

	const backups = new Backups(local, remote);

	backups.on('SMOKE_TESTING', () => Logger.log('Smoke testing'));

	backups.on('GENERATING_ACTIONS_NEEDED_TO_SYNC', () =>
		Logger.log('Generating actions needed to sync')
	);

	backups.on('ACTION_QUEUE_GENERATED', (n) => {
		totalItems = n;
		ipcRenderer.send('BACKUP_ACTION_QUEUE_GENERATED', { folderId, items: n });
	});

	backups.on('PULLING_FILE', (name, progress, kind) => {
		Logger.debug(`Pulling file ${name} from ${kind}: ${progress * 100}%`);
	});

	backups.on('FILE_PULLED', (name, kind) => {
		onCompletedItem();
		Logger.debug(`File ${name} pulled from ${kind}`);
		ipcRenderer.send('BACKUP_ACTION_DONE');
	});

	backups.on('ERROR_PULLING_FILE', (name, kind, errorName, errorDetails) => {
		Logger.error(
			`Error pulling file in ${kind} (${errorName}), details: ${JSON.stringify(
				errorDetails,
				null,
				2
			)}`
		);
		ipcRenderer.send('BACKUP_ISSUE', {
			action: 'PULL_ERROR',
			kind,
			name,
			errorName,
			errorDetails,
			process: 'BACKUPS',
			folderId,
		});
	});

	backups.on('RENAMING_FILE', (oldName, newName, kind) => {
		Logger.debug(`Renaming file ${oldName} -> ${newName} in ${kind}`);
	});

	backups.on('FILE_RENAMED', (oldName, newName, kind) => {
		Logger.debug(`File ${oldName} renamed -> ${newName} in ${kind}`);
		ipcRenderer.send('BACKUP_ACTION_DONE');
	});

	backups.on('ERROR_RENAMING_FILE', (oldName, newName, kind, errorName, errorDetails) => {
		Logger.error(
			`Error renaming file ${oldName} -> ${newName} in ${kind} (${errorName}), details: ${JSON.stringify(
				errorDetails,
				null,
				2
			)}`
		);
	});

	backups.on('DELETING_FILE', (name, kind) => {
		Logger.debug(`Deleting file ${name} in ${kind}`);
	});

	backups.on('FILE_DELETED', (name, kind) => {
		onCompletedItem();
		Logger.debug(`Deleted file ${name} in ${kind}`);
		ipcRenderer.send('BACKUP_ACTION_DONE');
	});

	backups.on('ERROR_DELETING_FILE', (name, kind, errorName, errorDetails) => {
		Logger.error(
			`Error deleting file ${name} in ${kind} (${errorName}), details: ${JSON.stringify(
				errorDetails,
				null,
				2
			)}`
		);
		ipcRenderer.send('BACKUP_ISSUE', {
			action: 'DELETE_ERROR',
			kind,
			name,
			errorName,
			errorDetails,
			process: 'BACKUPS',
			folderId,
		});
	});

	backups.on('DELETING_FOLDER', (name, kind) => {
		Logger.debug(`Deleting folder ${name} in ${kind}`);
	});

	backups.on('FOLDER_DELETED', (name, kind) => {
		Logger.debug(`Deleted folder ${name} in ${kind}`);
		ipcRenderer.send('BACKUP_ACTION_DONE');
	});

	backups.on('ERROR_DELETING_FOLDER', (name, kind, errorName, errorDetails) =>
		Logger.error(
			`Error deleting folder ${name} in ${kind} (${errorName}), details: ${JSON.stringify(
				errorDetails,
				null,
				2
			)}`
		)
	);

	backups.on('ERROR_READING_METADATA', (name, kind, errorName, errorDetails) => {
		Logger.error(
			`Error reading metadata ${name} in ${kind} (${errorName}), details: ${JSON.stringify(
				errorDetails,
				null,
				2
			)}`
		);
		ipcRenderer.send('BACKUP_ISSUE', {
			action: 'METADATA_READ_ERROR',
			kind,
			name,
			errorName,
			errorDetails,
			process: 'BACKUPS',
			folderId,
		});
	});

	try {
		await backups.run();
		Logger.log(`Backup done, folderId: ${folderId} & path: ${path}`);
		ipcRenderer.send('BACKUP_EXIT', folderId);
	} catch (err) {
		if (err instanceof ProcessFatalError) {
			Logger.error(
				`Backups fatal error (${err.name}), details: ${JSON.stringify(err.details, null, 2)}`
			);
			ipcRenderer.send('BACKUP_FATAL_ERROR', folderId, err.name as ProcessFatalErrorName);
		} else {
			Logger.error('Completely unhandled backups fatal error', JSON.stringify(err, null, 2));
			ipcRenderer.send('BACKUP_FATAL_ERROR', folderId, 'UNKNOWN');
		}
	}
}

setUp();
