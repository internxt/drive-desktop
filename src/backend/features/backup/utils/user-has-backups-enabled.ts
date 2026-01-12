import configStore from '../../../../apps/main/config';

export function userHasBackupsEnabled(): boolean {
  const availableUserProducts = configStore.get('availableUserProducts');
  return !!availableUserProducts?.backups;
}
