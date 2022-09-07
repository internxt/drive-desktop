import { ProcessFatalErrorName } from '../../workers/types';

const messages: Record<ProcessFatalErrorName, string> = {
  NO_INTERNET:
    "Looks like you are not connected to the internet, we'll try again later",
  NO_REMOTE_CONNECTION:
    "We could not connect to Internxt servers, we'll try again later",
  CANNOT_GET_CURRENT_LISTINGS:
    "We could not get the status of your current files, we'll try again later",
  BASE_DIRECTORY_DOES_NOT_EXIST: 'Unable to find your sync folder',
  INSUFICIENT_PERMISION_ACCESSING_BASE_DIRECTORY:
    'Internxt App does not have permission to access your sync folder',
  CANNOT_ACCESS_BASE_DIRECTORY: 'We could not access your local folder',
  CANNOT_ACCESS_TMP_DIRECTORY: 'We could not access your  local folder',
  UNKNOWN: 'An unknown error ocurred while trying to sync your files',
};

export default messages;
