import { MainVirtualDriveIPC } from '../ipcs/VirtualDriveIPC';
import { trackError, trackEvent } from './service';

MainVirtualDriveIPC.on('FILE_DELETED', (_, payload) => {
  const { name, extension, size } = payload;

  trackEvent('Delete Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
  });
});

MainVirtualDriveIPC.on('FILE_DOWNLOADING', (_, payload) => {
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

MainVirtualDriveIPC.on('FILE_DOWNLOADED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackEvent('Download Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

MainVirtualDriveIPC.on('FILE_UPLOADING', (_, payload) => {
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

MainVirtualDriveIPC.on('FILE_UPLOADED', (_, payload) => {
  const { name, extension, size, processInfo } = payload;

  trackEvent('Upload Completed', {
    file_name: name,
    file_extension: extension,
    file_size: size,
    elapsedTimeMs: processInfo.elapsedTime,
  });
});

MainVirtualDriveIPC.on('FILE_UPLOAD_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackError('Upload Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Upload',
  });
});

MainVirtualDriveIPC.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackError('Download Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Download',
  });
});

MainVirtualDriveIPC.on('FILE_RENAME_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackError('Rename Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Rename',
  });
});

MainVirtualDriveIPC.on('FILE_DELETION_ERROR', (_, payload) => {
  const { name, error } = payload;

  trackError('Delete Error', new Error(error), {
    itemType: 'File',
    root: '',
    from: name,
    action: 'Delete',
  });
});
