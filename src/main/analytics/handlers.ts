import { applicationOpened } from './service';
import eventBus from '../event-bus';

import './user-handlers';
import './sync-handlers';
import './backup-handlers';

eventBus.on('APP_IS_READY', applicationOpened);
