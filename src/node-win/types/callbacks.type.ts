import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';

type NapiCallbackFunction = (...args: any[]) => any;

type TNotifyDeleteCallback = (placeholderId: FilePlaceholderId | FolderPlaceholderId, callback: (response: boolean) => void) => void;
type TFetchDataCallback = (
  id: FilePlaceholderId,
  callback: (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>,
) => void;

export type InputSyncCallbacks = {
  fetchDataCallback: TFetchDataCallback;
  validateDataCallback?: NapiCallbackFunction;
  cancelFetchDataCallback?: NapiCallbackFunction;
  fetchPlaceholdersCallback?: NapiCallbackFunction;
  cancelFetchPlaceholdersCallback?: NapiCallbackFunction;
  notifyFileOpenCompletionCallback?: NapiCallbackFunction;
  notifyFileCloseCompletionCallback?: NapiCallbackFunction;
  notifyDehydrateCallback?: NapiCallbackFunction;
  notifyDehydrateCompletionCallback?: NapiCallbackFunction;
  notifyDeleteCallback?: TNotifyDeleteCallback;
  notifyDeleteCompletionCallback?: NapiCallbackFunction;
  noneCallback?: NapiCallbackFunction;
};

export type Callbacks = InputSyncCallbacks;
