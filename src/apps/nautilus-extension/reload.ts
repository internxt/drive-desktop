import Logger from 'electron-log';
import {
  copyNautilusExtensionFile,
  reloadNautilus,
  deleteNautilusExtensionFile,
} from './service';

async function reload() {
  await deleteNautilusExtensionFile();
  await copyNautilusExtensionFile();
  await reloadNautilus();
}

reload()
  .then(() => {
    Logger.info('Nautilus extension reloaded');
  })
  .catch((err) => {
    Logger.error(err);
  });
