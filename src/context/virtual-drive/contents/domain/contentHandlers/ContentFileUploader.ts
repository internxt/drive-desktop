type ConenentsId = string;

export type FileUploadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (fileId: ConenentsId) => void;
  error: (error: Error) => void;
};
