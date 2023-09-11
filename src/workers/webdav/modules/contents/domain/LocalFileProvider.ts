import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { LocalFileContents } from './LocalFileContents';

export interface LocalContentsProvider {
  provide: (path: string) => {
    contents: LocalFileContents;
    abortSignal: AbortSignal;
  };
}
