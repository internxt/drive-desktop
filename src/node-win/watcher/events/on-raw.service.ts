import { stat } from 'fs/promises';

import { DetectContextMenuActionService } from '../detect-context-menu-action.service';
import { Watcher } from '../watcher';
import { fileSystem } from '@/infra/file-system/file-system.module';

export class OnRawService {
  constructor(private readonly detectContextMenuAction = new DetectContextMenuActionService()) {}

  async execute({ self, event, path, details }: TProps) {
    try {
      if (event === 'change' && details.prev && details.curr) {
        const { data, error } = await fileSystem.stat({ absolutePath: path });

        if (error) {
          /**
           * v2.5.6 Daniel Jiménez
           * When placeholder is deleted it also emits a change event, we want to ignore that error.
           */
          if (error.code === 'NON_EXISTS') return;
          throw error;
        }

        if (data.isDirectory()) {
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
