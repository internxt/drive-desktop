import eventBus from '../event-bus';
import { clearTempFolder } from '../app-info/helpers';

eventBus.on('USER_LOGGED_IN', () => {
  clearTempFolder();
});

eventBus.on('USER_LOGGED_OUT', () => {
  clearTempFolder();
});
