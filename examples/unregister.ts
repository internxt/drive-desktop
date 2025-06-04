import { deleteInfoItems } from './info-items-manager';
import { DependencyInjectionAddonProvider } from '@/node-win/addon-wrapper';

const addon = DependencyInjectionAddonProvider.get();

const syncRoots = addon.getRegisteredSyncRoots();

syncRoots.forEach((syncRoot) => {
  addon.unregisterSyncRoot({ providerId: syncRoot.id });
});

deleteInfoItems();
