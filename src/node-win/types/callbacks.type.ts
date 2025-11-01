import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';

export type CallbackDownload = (data: boolean, buffer?: Buffer, offset?: number) => void;
type TFetchDataCallback = (id: FilePlaceholderId, callback: CallbackDownload) => Promise<void>;

export type Callbacks = {
  fetchDataCallback: TFetchDataCallback;
  cancelFetchDataCallback: () => void;
};
