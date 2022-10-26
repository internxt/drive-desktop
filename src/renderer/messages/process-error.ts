import { ProcessErrorName } from '../../workers/types';

type ProcessErrorMessages = Record<ProcessErrorName, string>;

export const shortMessages: ProcessErrorMessages = {
  NOT_EXISTS: "File doesn't exist",
  NO_PERMISSION: 'Insufficient permissions',
  NO_INTERNET: 'No internet connection',
  NO_REMOTE_CONNECTION: "Can't connect to Internxt servers",
  BAD_RESPONSE: 'Bad response from Internxt servers',
  EMPTY_FILE: 'File is empty',
  UNKNOWN: 'Unknown error',
  TRAVERSAL_PATH: 'Posible risk',
};

export const longMessages: ProcessErrorMessages = {
  NOT_EXISTS:
    "This file was present when we compared your local folder with your Internxt drive but dissapeared when we tried to access it. If you deleted this file, don't worry, this error should dissapear the next time the sync process starts.",
  NO_PERMISSION:
    'The permissions required are too strict for us to access this file. Please, change them in your file explorer.',
  NO_INTERNET:
    'We could not connect to internet while processing this file. Please, try starting the sync process again.',
  NO_REMOTE_CONNECTION:
    'We had no access to our servers while processing this file. Please, try starting the sync process again.',
  BAD_RESPONSE:
    'We got a bad response from our servers while processing this file. Please, try starting the sync process again.',
  EMPTY_FILE:
    "We don't support files with a size of 0 bytes because of our processes of sharding and encryption",
  UNKNOWN: 'An unknown error happened while processing this file.',
  TRAVERSAL_PATH:
    'This file name cotains a sequence of characters that could lead to a path travesal attack',
};
