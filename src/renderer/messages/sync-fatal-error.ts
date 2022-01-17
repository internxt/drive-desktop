import { SyncFatalErrorName } from '../../workers/sync/sync';

const messages: Record<SyncFatalErrorName, string> = {
  NO_INTERNET:
    "Looks like you are not connected to the internet, we'll try again later",
  NO_REMOTE_CONNECTION:
    "We could not connect to Internxt servers, we'll try again later",
  CANNOT_GET_CURRENT_LISTINGS:
    "We could not get the status of your current files, we'll try again later",
  CANNOT_ACCESS_BASE_DIRECTORY:
    'We could not access your Internxt Drive local folder',
  CANNOT_ACCESS_TMP_DIRECTORY:
    'We could not access your Internxt Drive local folder',
  UNKNOWN: 'An unknown error ocurred while trying to sync your files',
};

export default messages;
