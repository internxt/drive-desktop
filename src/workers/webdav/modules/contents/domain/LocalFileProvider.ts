import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { Contents } from './Contents';

export interface LocalContentsProvider {
  provide: (path: string) => {
    contents: Contents;
    metadata: ItemMetadata;
    abortSignal: AbortSignal;
  };
}
