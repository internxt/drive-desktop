import { NotifyMainProcessHydrationFinished } from '../../modules/placeholders/application/NotifyMainProcessHydrationFinished';
import { PlaceholderCreator } from '../../modules/placeholders/domain/PlaceholderCreator';

export interface PlaceholderContainer {
  placeholderCreator: PlaceholderCreator;
  notifyMainProcessHydrationFinished: NotifyMainProcessHydrationFinished;
}
