import Logger from 'electron-log';
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
    Logger.info('Nautilus extension reloaded');
  })
  .catch((err) => {
    Logger.error(err);
  });
