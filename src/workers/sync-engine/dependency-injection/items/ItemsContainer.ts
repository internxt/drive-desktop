import { ExistingItemsTraverser } from '../../modules/items/application/ExistingItemsTraverser';
import { AllStatusesTraverser } from '../../modules/items/application/AllStatusesTraverser';

export interface ItemsContainer {
  existingItemsTraverser: ExistingItemsTraverser;
  allStatusesTraverser: AllStatusesTraverser;
}
