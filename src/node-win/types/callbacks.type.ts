export type CallbackDownload = (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>;
type TFetchDataCallback = (id: string, callback: CallbackDownload) => Promise<void>;

export type Callbacks = {
  fetchDataCallback: TFetchDataCallback;
  cancelFetchDataCallback: (path: string) => void;
};
