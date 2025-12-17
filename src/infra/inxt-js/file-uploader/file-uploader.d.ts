export type FileUploaderCallbacks = {
  onProgress: (_: { progress: number }) => void;
  onError: () => void;
};
