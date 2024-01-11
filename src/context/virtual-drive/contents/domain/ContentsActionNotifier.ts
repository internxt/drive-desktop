export interface ContentsActionNotifier {
  uploadStarted(
    name: string,
    extension: string,
    size: number,
    processInfo: { elapsedTime: number }
  ): void;

  uploadProgress(
    name: string,
    extension: string,
    size: number,
    processInfo: { elapsedTime: number; progress: number }
  ): void;

  uploadError(name: string, extension: string, error: string): void;

  uploadCompleted(
    name: string,
    extension: string,
    size: number,
    processInfo: { elapsedTime: number }
  ): void;
}
