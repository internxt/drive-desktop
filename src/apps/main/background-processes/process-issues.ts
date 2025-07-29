import eventBus from '../event-bus';
import { IssuesModule } from '@internxt/drive-desktop-core/build/backend';

export function setupIpcIssues() {
  eventBus.on('USER_LOGGED_OUT', () => {
    IssuesModule.clearIssues();
  });
}
