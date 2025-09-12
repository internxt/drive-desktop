import configStore from '../../../../apps/main/config';

export function getStoredUserProducts() {
  return configStore.get('availableUserProducts');
}
