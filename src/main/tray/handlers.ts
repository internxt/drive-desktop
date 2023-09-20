import { ipcMainDrive } from '../ipcs/mainDrive';
import { setTrayStatus } from './tray';

ipcMainDrive.on('FOLDER_CREATING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FOLDER_CREATED', () => {
  setTrayStatus('STANDBY');
});

ipcMainDrive.on('FOLDER_RENAMING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FOLDER_RENAMED', () => {
  setTrayStatus('STANDBY');
});

ipcMainDrive.on('FILE_DELETING', () => {
  setTrayStatus('SYNCING');
});
ipcMainDrive.on('FILE_DELETED', () => {
  setTrayStatus('STANDBY');
});

ipcMainDrive.on('FILE_DOWNLOADING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FILE_MOVED', () => {
  setTrayStatus('STANDBY');
});

ipcMainDrive.on('FILE_OVERWRITED', () => {
  setTrayStatus('STANDBY');
});

ipcMainDrive.on('FILE_RENAMING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FILE_RENAMED', () => {
  setTrayStatus('LOADING');
});

ipcMainDrive.on('FILE_CLONNED', () => {
  setTrayStatus('STANDBY');
});

ipcMainDrive.on('FILE_UPLOADING', () => {
  setTrayStatus('SYNCING');
});

ipcMainDrive.on('FILE_UPLOADED', () => {
  setTrayStatus('STANDBY');
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
