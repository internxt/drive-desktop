export type CallbackDownload = (data: boolean, buffer?: Buffer, offset?: number) => void;
type TFetchDataCallback = (path: string, callback: CallbackDownload) => Promise<void>;

export type Callbacks = {
  fetchDataCallback: TFetchDataCallback;
  cancelFetchDataCallback: () => void;
};
