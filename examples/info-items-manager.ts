import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { v4 } from 'uuid';

import { TMP_PATH } from './settings';

const infoItemsPath = join(TMP_PATH, 'info-items.json');
const serverPath = join(TMP_PATH, 'fake-server');

export const initInfoItems = () => {
  if (!existsSync(infoItemsPath)) {
    writeFileSync(infoItemsPath, JSON.stringify({}));
  }

  if (!existsSync(serverPath)) {
    mkdirSync(serverPath);
  }
};

const getInfoItems = () => {
  return JSON.parse(readFileSync(infoItemsPath, 'utf8'));
};

export const deleteInfoItems = () => {
  writeFileSync(infoItemsPath, JSON.stringify({}));
};

export const addInfoItem = (itemPath: string) => {
  const fileName = basename(itemPath);
  const serverItemPath = join(serverPath, fileName);
  copyFileSync(itemPath, serverItemPath);

  const id = v4();
  const infoItems = getInfoItems();
  infoItems[id] = serverItemPath;

  writeFileSync(infoItemsPath, JSON.stringify(infoItems, null, 2));
  return id;
};

export const getInfoItem = (id: string) => {
  const infoItems = getInfoItems();
  return infoItems[id];
};
