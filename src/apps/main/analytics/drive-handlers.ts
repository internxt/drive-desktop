import { MainProcessSyncEngineIPC } from '../MainProcessSyncEngineIPC';
import { trackError, trackEvent } from './service';

MainProcessSyncEngineIPC.on('FILE_DELETED', (_, payload) => {
  const { name, extension, size } = payload;

  trackEvent('Delete Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
  });
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOADING', (_, payload) => {
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

MainProcessSyncEngineIPC.on('FILE_DOWNLOADED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackEvent('Download Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

MainProcessSyncEngineIPC.on('FILE_UPLOADING', (_, payload) => {
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

MainProcessSyncEngineIPC.on('FILE_UPLOADED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackEvent('Upload Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

MainProcessSyncEngineIPC.on('FILE_UPLOAD_ERROR', (_, payload) => {
  const { name, cause: error } = payload;

  trackError('Upload Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Upload',
  });
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  const { name, cause } = payload;

  trackError('Download Error', new Error(cause), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Download',
  });
});

MainProcessSyncEngineIPC.on('FILE_RENAME_ERROR', (_, payload) => {
  const { name, cause } = payload;

  trackError('Rename Error', new Error(cause), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Rename',
  });
});

MainProcessSyncEngineIPC.on('FILE_DELETION_ERROR', (_, payload) => {
  const { name, cause } = payload;

  trackError('Delete Error', new Error(cause), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Delete',
  });
});
