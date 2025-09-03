import { logger } from '@/apps/shared/logger/logger';
import { PATHS } from '@/core/electron/paths';
import Database from 'better-sqlite3';

export class RemoveAntivirusTable {
  static readonly KEY = 'v2-5-7-remove-antivirus-table';

  static async run() {
    try {
      const db = new Database(PATHS.SQLITE_DB);
      db.prepare('DROP TABLE IF EXISTS scanned_files').run();
    } catch (exc) {
      logger.error({ msg: 'Error removing antivirus table', exc });
    }
  }
}
