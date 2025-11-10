export type CallbackDownload = (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>;

export type Callbacks = {
  fetchDataCallback: (path: string, callback: CallbackDownload) => void;
  cancelFetchDataCallback: (path: string) => void;
};
