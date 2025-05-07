import { GeneralErrorName } from '../../shared/types';

type GeneralErrorMessages = Record<GeneralErrorName, string>;

const shortMessages: GeneralErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Could not retrieve your device’s name.',
};

const longMessages: GeneralErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Please restart the app.',
};

export const generalErrors: {
  longMessages: GeneralErrorMessages;
  shortMessages: GeneralErrorMessages;
} = {
  shortMessages,
  longMessages,
};
