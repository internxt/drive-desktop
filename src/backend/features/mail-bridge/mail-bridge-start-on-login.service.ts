import electronStore from '../../../apps/main/config';

export function isMailBridgeStartOnLoginEnabled() {
  return electronStore.get('mailBridgeStartOnLogin');
}

export function setMailBridgeStartOnLogin({ enabled }: { enabled: boolean }) {
  electronStore.set('mailBridgeStartOnLogin', enabled);
}
