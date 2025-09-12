import { logger } from '@internxt/drive-desktop-core/build/backend';
import {
  copyNautilusExtensionFile,
  reloadNautilus,
  deleteNautilusExtensionFile,
} from './service';

// This file is meant to be used to manually reload the extension
// in development by package json script reinstall:nautilus-extension

async function reload() {
  await deleteNautilusExtensionFile();
  await copyNautilusExtensionFile();
  await reloadNautilus();
}

reload()
  .then(() => {
    logger.debug({ msg: 'Nautilus extension reloaded' });
  })
  .catch((error) => {
    logger.error({ msg: 'Error while realoading Nautilus extension:', error });
  });
