import { LocalFileContents } from './LocalFileContents';

export interface LocalContentsProvider {
  provide: (path: string) => Promise<{
    contents: LocalFileContents;
    abortSignal: AbortSignal;
  }>;
}
