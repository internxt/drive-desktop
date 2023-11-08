import { FilePlaceholderId } from '../../modules/files/domain/PlaceholderId';
import { NotifyMainProcessHydrationFinished } from '../../modules/placeholders/application/NotifyMainProcessHydrationFinished';
import { CallbackController } from './CallbackController';

export class NotifyPlaceholderHydrationFinished extends CallbackController {
  constructor(private readonly notifier: NotifyMainProcessHydrationFinished) {
    super();
  }

  async execute(filePlaceholderId: FilePlaceholderId) {
    const trimmedId = this.trim(filePlaceholderId);
    const [_, contentsId] = trimmedId.split(':');

    if (!contentsId) return;

    await this.notifier.run(contentsId);
  }
}
