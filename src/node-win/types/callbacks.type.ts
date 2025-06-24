type NapiCallbackFunction = (...args: any[]) => any;

type FilePlaceholderIdPrefixType = 'FILE:';

type FilePlaceholderId = `${FilePlaceholderIdPrefixType}${string}`;

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
  notifyDeleteCallback?: NapiCallbackFunction;
  notifyDeleteCompletionCallback?: NapiCallbackFunction;
  notifyRenameCallback?: NapiCallbackFunction;
  notifyRenameCompletionCallback?: NapiCallbackFunction;
  noneCallback?: NapiCallbackFunction;
};

export type Callbacks = InputSyncCallbacks;
