import { ipcMainDrive } from '../ipcs/mainDrive';
import { setTrayStatus } from './tray';

ipcMainDrive.on('FOLDER_CREATING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FOLDER_CREATED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FOLDER_RENAMING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FOLDER_RENAMED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FILE_DELETING', () => {
  setTrayStatus('SYNCING');
});
ipcMainDrive.on('FILE_DELETED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FILE_DOWNLOADING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FILE_DOWNLOADED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FILE_MOVED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FILE_OVERWRITED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FILE_RENAMING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FILE_RENAMED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FILE_CLONNED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FILE_UPLOADING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FILE_UPLOADED', () => {
  setTrayStatus('IDLE');
});

ipcMainDrive.on('FILE_UPLOAD_ERROR', () => {
  setTrayStatus('ALERT');
});

ipcMainDrive.on('FILE_DOWNLOAD_ERROR', () => {
  setTrayStatus('ALERT');
});

ipcMainDrive.on('FILE_RENAME_ERROR', () => {
  setTrayStatus('ALERT');
});

ipcMainDrive.on('FILE_DELETION_ERROR', () => {
  setTrayStatus('ALERT');
});
