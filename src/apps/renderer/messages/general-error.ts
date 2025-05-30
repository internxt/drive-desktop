import { GeneralIssue } from '@/apps/main/background-processes/issues';

type GeneralErrorMessages = Record<GeneralIssue['error'], string>;

/**
 * v2.5.3 Alexis Mora
 * TODO: Make this messages translatable
 */
const shortMessages: GeneralErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Could not retrieve your device’s name.',
  WEBSOCKET_CONNECTION_ERROR: 'WebSocket connection error.',
  NETWORK_CONNECTIVITY_ERROR: 'Network connectivity error.',
  SERVER_INTERNAL_ERROR: 'Server internal error.',
};

const longMessages: GeneralErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Please restart the app.',
  WEBSOCKET_CONNECTION_ERROR: 'Please check your internet connection and try again.',
  NETWORK_CONNECTIVITY_ERROR: 'Please check your internet connection and try again.',
  SERVER_INTERNAL_ERROR: 'Please try again later. If the problem persists, contact support.',
};

export const generalErrors: {
  longMessages: GeneralErrorMessages;
  shortMessages: GeneralErrorMessages;
} = {
  shortMessages,
  longMessages,
};
