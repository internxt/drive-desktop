import { ClientCompatibilityState } from '@internxt/drive-desktop-core/build/backend';
import { getClientCompatibilityTexts } from '@internxt/drive-desktop-core/build/frontend/features/client-compatibility';
import { Notification } from 'electron';
import { getLanguage } from '@/apps/main/config/language';
import { showFrontend } from '@/apps/main/windows/widget';

export function showClientCompatibilityNotification({ state }: { state: ClientCompatibilityState }) {
  const texts = getClientCompatibilityTexts({ state, language: getLanguage() });
  if (!texts) return;

  const notification = new Notification({ title: texts.title, body: texts.description });
  notification.on('click', () => showFrontend());
  notification.show();
}
