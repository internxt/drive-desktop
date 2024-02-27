import { AppError } from '../../../shared/issues/AppError';

type AppErrorMessages = Record<AppError, string>;

export const shortMessages: AppErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Could not retrieve your device’s name.',
};

export const longMessages: AppErrorMessages = {
  UNKNOWN_DEVICE_NAME: 'Please restart the app.',
};

export const generalErrors: {
  longMessages: AppErrorMessages;
  shortMessages: AppErrorMessages;
} = {
  shortMessages,
  longMessages,
};
