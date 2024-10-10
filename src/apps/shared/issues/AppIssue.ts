import { AppError } from './AppError';

export type AppIssue = {
  action: 'GET_DEVICE_NAME_ERROR';
  errorName: AppError;
  errorDetails: {
    name: string;
    message: string;
    stack: string;
  };
};
