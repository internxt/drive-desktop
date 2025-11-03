export type CallbackDownload = (buffer: Buffer, offset: number) => void;

export type Callbacks = {
  fetchDataCallback: (path: string, callback: CallbackDownload) => void;
  cancelFetchDataCallback: (path: string) => void;
};
