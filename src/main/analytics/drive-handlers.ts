import { ipcMainDrive } from '../ipcs/mainDrive';
import { trackError, trackEvent } from './service';

ipcMainDrive.on('FILE_DELETED', (_, payload) => {
  const { name, extension, size } = payload;

  trackEvent('Delete Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
  });
});

ipcMainDrive.on('FILE_DOWNLOADING', (_, payload) => {
  const { name, size, extension, processInfo } = payload;

  if (!processInfo.progress) {
    trackEvent('Download Started', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: processInfo.elapsedTime,
    });
  }
});

ipcMainDrive.on('FILE_DOWNLOADED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackEvent('Download Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

ipcMainDrive.on('FILE_CLONNED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackEvent('Upload Completed', {
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
    trackEvent('Upload Started', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: processInfo.elapsedTime,
    });
  }
});

ipcMainDrive.on('FILE_UPLOADED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackEvent('Upload Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

ipcMainDrive.on('FILE_UPLOAD_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackError('Upload Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Upload',
  });
});

ipcMainDrive.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackError('Download Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Download',
  });
});

ipcMainDrive.on('FILE_RENAME_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackError('Rename Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Rename',
  });
});

ipcMainDrive.on('FILE_DELETION_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackError('Delete Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Delete',
  });
});
