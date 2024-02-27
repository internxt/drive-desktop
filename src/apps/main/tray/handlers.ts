import { MainProcessSyncEngineIPC } from '../MainProcessSyncEngineIPC';
import { setTrayStatus } from './tray';

MainProcessSyncEngineIPC.on('FOLDER_CREATING', () => {
  setTrayStatus('SYNCING');
});

MainProcessSyncEngineIPC.on('FOLDER_CREATED', () => {
  setTrayStatus('IDLE');
});

MainProcessSyncEngineIPC.on('FOLDER_RENAMING', () => {
  setTrayStatus('SYNCING');
});

MainProcessSyncEngineIPC.on('FOLDER_RENAMED', () => {
  setTrayStatus('IDLE');
});

MainProcessSyncEngineIPC.on('FILE_DELETING', () => {
  setTrayStatus('SYNCING');
});
MainProcessSyncEngineIPC.on('FILE_DELETED', () => {
  setTrayStatus('IDLE');
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOADING', () => {
  setTrayStatus('SYNCING');
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOADED', () => {
  setTrayStatus('IDLE');
});

MainProcessSyncEngineIPC.on('FILE_MOVED', () => {
  setTrayStatus('IDLE');
});

MainProcessSyncEngineIPC.on('FILE_RENAMING', () => {
  setTrayStatus('SYNCING');
});

MainProcessSyncEngineIPC.on('FILE_RENAMED', () => {
  setTrayStatus('IDLE');
});

MainProcessSyncEngineIPC.on('FILE_UPLOADING', () => {
  setTrayStatus('SYNCING');
});

MainProcessSyncEngineIPC.on('FILE_UPLOADED', () => {
  setTrayStatus('IDLE');
});

MainProcessSyncEngineIPC.on('FILE_UPLOAD_ERROR', () => {
  setTrayStatus('ALERT');
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOAD_ERROR', () => {
  setTrayStatus('ALERT');
});

MainProcessSyncEngineIPC.on('FILE_RENAME_ERROR', () => {
  setTrayStatus('ALERT');
});

MainProcessSyncEngineIPC.on('FILE_DELETION_ERROR', () => {
  setTrayStatus('ALERT');
});
