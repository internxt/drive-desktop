import { GeneralIssueError } from '@/apps/main/background-processes/issues';

type GeneralErrorMessages = Record<GeneralIssueError, string>;

/**
 * v2.5.3 Alexis Mora
 * TODO: Make this messages translatable
 */
const shortMessages: GeneralErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Could not retrieve your device’s name.',
  WEBSOCKET_CONECTION_ERROR: 'WebSocket connection error.',
};

const longMessages: GeneralErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Please restart the app.',
  WEBSOCKET_CONECTION_ERROR: 'Please check your internet connection and try again.',
};

export const generalErrors: {
  longMessages: GeneralErrorMessages;
  shortMessages: GeneralErrorMessages;
} = {
  shortMessages,
  longMessages,
};
