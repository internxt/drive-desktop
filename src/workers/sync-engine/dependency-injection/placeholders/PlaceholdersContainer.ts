import { TreePlaceholderCreator } from 'workers/sync-engine/modules/placeholders/application/TreePlaceholderCreator';
import { PlaceholderCreator } from '../../modules/placeholders/domain/PlaceholderCreator';

export interface PlaceholderContainer {
  placeholderCreator: PlaceholderCreator;
  treePlaceholderCreator: TreePlaceholderCreator;
}
