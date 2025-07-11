import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';

type TFetchDataCallback = (
  id: FilePlaceholderId,
  callback: (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>,
) => void;

export type InputSyncCallbacks = {
  fetchDataCallback: TFetchDataCallback;
  cancelFetchDataCallback: () => void;
};

export type Callbacks = InputSyncCallbacks;
