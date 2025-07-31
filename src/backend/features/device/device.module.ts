import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import { getOrCreateDevice } from './getOrCreateDevice';
import { renameDevice } from './renameDevice';

export const DeviceModule = {
  getOrCreateDevice,
  addUnknownDeviceIssue,
  getDeviceIdentifier,
  renameDevice,
};
