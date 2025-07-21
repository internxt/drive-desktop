import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import { getOrCreateDevice } from './getOrCreateDevice';

export const DeviceModule = {
  getOrCreateDevice,
  addUnknownDeviceIssue,
  getDeviceIdentifier,
};
