import eventBus from '../event-bus';
import { userSignin, userLogout } from './service';

eventBus.on('USER_LOGGED_IN', () => {
  userSignin();
});

eventBus.on('USER_LOGGED_OUT', () => {
  userLogout();
});
