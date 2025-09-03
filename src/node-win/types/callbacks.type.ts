import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';

export type CallbackDownload = (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>;
type TFetchDataCallback = (id: FilePlaceholderId, callback: CallbackDownload) => Promise<void>;

export type Callbacks = {
  fetchDataCallback: TFetchDataCallback;
  cancelFetchDataCallback: () => void;
};
