import { LocalFileContents } from './LocalFileContents';

export interface LocalContentsProvider {
  provide: (path: string) => {
    contents: LocalFileContents;
    abortSignal: AbortSignal;
  };
}
