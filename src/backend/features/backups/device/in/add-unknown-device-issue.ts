import { addGeneralIssue } from '@/apps/main/background-processes/issues';

/**
 * V2.5.5
 * Alexis Mora
 * TODO: Change this to accept an errorMessage instead of an Error object,
 * since this function only uses the message from the error
 */
export const addUnknownDeviceIssue = (error: Error) => {
  addGeneralIssue({
    name: error.name,
    error: 'UNKNOWN_DEVICE_NAME',
  });
};
