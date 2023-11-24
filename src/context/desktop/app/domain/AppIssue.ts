export type AppIssue = {
  action: 'GET_DEVICE_NAME_ERROR';
  errorName: 'UNKNOWN_DEVICE_NAME';
  process: 'GENERAL';
  errorDetails: {
    name: string;
    messages: string;
    stack: string;
  };
};
