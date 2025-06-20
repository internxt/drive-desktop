import { stat } from 'fs/promises';

import { DetectContextMenuActionService } from '../detect-context-menu-action.service';
import { Watcher } from '../watcher';

export class OnRawService {
  constructor(private readonly detectContextMenuAction = new DetectContextMenuActionService()) {}

  async execute({ self, event, path, details }: TProps) {
    try {
      if (event === 'change' && details.prev && details.curr) {
        const item = await stat(path);
        if (item.isDirectory()) {
          return;
        }

        const action = await this.detectContextMenuAction.execute({ self, details, path, isFolder: false });

        if (action) {
          self.logger.debug({ msg: 'change', path, action });
        }
      }
    } catch (error) {
      self.logger.error({ msg: 'Error on change', error });
    }
  }
}

type TProps = {
  self: Watcher;
  event: string;
  path: string;
  details: any;
};
