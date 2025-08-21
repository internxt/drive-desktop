import { addUnknownDeviceIssue } from './addUnknownDeviceIssue';
import { getBackupsFromDevice } from './getBackupsFromDevice';
import { getDeviceIdentifier } from './getDeviceIdentifier';
import { getOrCreateDevice } from './getOrCreateDevice';
import { renameDevice } from './renameDevice';

export const DeviceModule = {
  getOrCreateDevice,
  addUnknownDeviceIssue,
  getDeviceIdentifier,
  renameDevice,
  getBackupsFromDevice,
};
