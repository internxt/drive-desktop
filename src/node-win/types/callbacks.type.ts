export type NapiCallbackFunction = (...args: any[]) => any;

export type FilePlaceholderIdPrefixType = 'FILE:';

export type FilePlaceholderId = `${FilePlaceholderIdPrefixType}${string}`;

export type TFetchDataCallback = (
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
  notifyDeleteCallback?: NapiCallbackFunction;
  notifyDeleteCompletionCallback?: NapiCallbackFunction;
  notifyRenameCallback?: NapiCallbackFunction;
  notifyRenameCompletionCallback?: NapiCallbackFunction;
  noneCallback?: NapiCallbackFunction;
};

export type Callbacks = InputSyncCallbacks;
