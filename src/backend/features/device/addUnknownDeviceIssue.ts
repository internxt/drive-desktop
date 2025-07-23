import { addAppIssue } from '../../../apps/main/issues/app';

export const addUnknownDeviceIssue = (error: Error) => {
  addAppIssue({
    errorName: 'UNKNOWN_DEVICE_NAME',
    action: 'GET_DEVICE_NAME_ERROR',
    errorDetails: {
      name: error.name,
      message: error.message,
      stack: error.stack || '',
    },
  });
};
