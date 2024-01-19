import { MainVirtualDriveIPC } from '../ipcs/VirtualDriveIPC';
import { setTrayStatus } from './tray';

MainVirtualDriveIPC.on('FOLDER_CREATING', () => {
  setTrayStatus('SYNCING');
});

MainVirtualDriveIPC.on('FOLDER_CREATED', () => {
  setTrayStatus('IDLE');
});

MainVirtualDriveIPC.on('FOLDER_RENAMING', () => {
  setTrayStatus('SYNCING');
});

MainVirtualDriveIPC.on('FOLDER_RENAMED', () => {
  setTrayStatus('IDLE');
});

MainVirtualDriveIPC.on('FILE_DELETING', () => {
  setTrayStatus('SYNCING');
});
MainVirtualDriveIPC.on('FILE_DELETED', () => {
  setTrayStatus('IDLE');
});

MainVirtualDriveIPC.on('FILE_DOWNLOADING', () => {
  setTrayStatus('SYNCING');
});

MainVirtualDriveIPC.on('FILE_DOWNLOADED', () => {
  setTrayStatus('IDLE');
});

MainVirtualDriveIPC.on('FILE_MOVED', () => {
  setTrayStatus('IDLE');
});

MainVirtualDriveIPC.on('FILE_RENAMING', () => {
  setTrayStatus('SYNCING');
});

MainVirtualDriveIPC.on('FILE_RENAMED', () => {
  setTrayStatus('IDLE');
});

MainVirtualDriveIPC.on('FILE_UPLOADING', () => {
  setTrayStatus('SYNCING');
});

MainVirtualDriveIPC.on('FILE_UPLOADED', () => {
  setTrayStatus('IDLE');
});

MainVirtualDriveIPC.on('FILE_UPLOAD_ERROR', () => {
  setTrayStatus('ALERT');
});

MainVirtualDriveIPC.on('FILE_DOWNLOAD_ERROR', () => {
  setTrayStatus('ALERT');
});

MainVirtualDriveIPC.on('FILE_RENAME_ERROR', () => {
  setTrayStatus('ALERT');
});

MainVirtualDriveIPC.on('FILE_DELETION_ERROR', () => {
  setTrayStatus('ALERT');
});
