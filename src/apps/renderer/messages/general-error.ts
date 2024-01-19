import { AppErrorName } from '../../../shared/issues/AppIssue';

type GeneralErrorMessages = Record<AppErrorName, string>;

export const shortMessages: GeneralErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Could not retrieve your device’s name.',
};

export const longMessages: GeneralErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Please restart the app.',
};

export const generalErrors: {
  longMessages: GeneralErrorMessages;
  shortMessages: GeneralErrorMessages;
} = {
  shortMessages,
  longMessages,
};
