import { useEffect } from 'react';
import { useTranslationContext } from '../context/LocalContext';

export function useBackupNotifications() {
  const { translate } = useTranslationContext();

  useEffect(() => {
    const handleBackupFailed = (error: { message: string; cause: string }) => {
      let notificationTitle = '';
      let notificationBody = '';

      switch (error.cause) {
        case 'NO_INTERNET':
          notificationTitle = translate('backupErrors.noInternet.title');
          notificationBody = translate('backupErrors.noInternet.message');
          break;
        case 'SERVER_ERROR':
          notificationTitle = translate('backupErrors.serverError.title');
          notificationBody = translate('backupErrors.serverError.message');
          break;
        case 'CLIENT_ERROR':
          notificationTitle = translate('backupErrors.clientError.title');
          notificationBody = translate('backupErrors.clientError.message');
          break;
        default:
          notificationTitle = translate('backupErrors.generic.title');
          notificationBody = translate('backupErrors.generic.message');
          break;
      }

      new Notification(notificationTitle, {
        body: notificationBody,
      });
    };

    const removeListener = window.electron.onBackupFailed(handleBackupFailed);

    return () => {
      removeListener();
    };
  }, [translate]);
}
