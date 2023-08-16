import { ipcMainDrive } from '../ipcs/mainDrive';
import { trackWebdavError, trackWebdavEvent } from './service';

ipcMainDrive.on('FILE_DELETED', (_, payload) => {
  const { name, extension, size } = payload;

  trackWebdavEvent('Delete Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
  });
});

ipcMainDrive.on('FILE_DOWNLOADING', (_, payload) => {
  const { name, size, extension, processInfo } = payload;

  if (!processInfo.progress) {
    trackWebdavEvent('Download Started', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: processInfo.elapsedTime,
    });
  }
});

ipcMainDrive.on('FILE_DOWNLOADED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackWebdavEvent('Download Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

ipcMainDrive.on('FILE_CLONNED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackWebdavEvent('Upload Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    cloned: true,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

ipcMainDrive.on('FILE_UPLOADING', (_, payload) => {
  const { name, size, extension, processInfo } = payload;

  if (!processInfo.progress) {
    trackWebdavEvent('Upload Started', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: processInfo.elapsedTime,
    });
  }
});

ipcMainDrive.on('FILE_UPLOADED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackWebdavEvent('Upload Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

ipcMainDrive.on('FILE_UPLOAD_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackWebdavError('Upload Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Upload',
  });
});

ipcMainDrive.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackWebdavError('Download Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Download',
  });
});

ipcMainDrive.on('FILE_RENAME_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackWebdavError('Rename Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Rename',
  });
});

ipcMainDrive.on('FILE_DELETE_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackWebdavError('Delete Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Delete',
  });
});
