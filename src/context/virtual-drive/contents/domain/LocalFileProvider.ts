import { LocalFileContents } from './LocalFileContents';

export abstract class LocalContentsProvider {
  abstract provide: (path: string) => Promise<{
    contents: LocalFileContents;
    abortSignal: AbortSignal;
  }>;
}
