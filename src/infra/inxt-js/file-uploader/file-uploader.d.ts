export type FileUploaderCallbacks = {
  onProgress: (_: { progress: number }) => void;
  onFinish: () => void;
  onError: () => void;
};
