const AppErrors = ['UNKNOWN_DEVICE_NAME'] as const;

export type AppError = (typeof AppErrors)[number];

export type AppIssue = {
  action: 'GET_DEVICE_NAME_ERROR';
  errorName: AppError;
  errorDetails: {
    name: string;
    message: string;
    stack: string;
  };
};
