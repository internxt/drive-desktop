import { useEffect, useState } from 'react';
import { useTranslationContext } from '../../../context/LocalContext';

type NotificationMessagePops = {
  title: string;
  body: string;
};

export default function useVirtualDriveRootPicker() {
  const { translate } = useTranslationContext();
  const [rootPath, setRootPath] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  async function refreshRootPath() {
    const currentRootPath = await window.electron.getVirtualDriveRoot();
    setRootPath(currentRootPath);
  }

  async function onChooseFolder() {
    setIsUpdating(true);

    try {
      const selectedPath = await window.electron.chooseSyncRootWithDialog();

      if (selectedPath.status === 'cancelled') {
        return;
      }

      if (selectedPath.status === 'error') {
        showValidationNotification({
          title: translate('settings.general.virtual-drive-root.errors.title'),
          body: getChangeRootErrorMessage({ errorCode: selectedPath.code, translate }),
        });

        return;
      }

      setRootPath(selectedPath.path);
    } catch (error) {
      window.electron.logger.error({
        msg: '[SETTINGS][GENERAL] Failed to update virtual drive root folder',
        error,
      });

      showValidationNotification({
        title: translate('settings.general.virtual-drive-root.errors.title'),
        body: translate('settings.general.virtual-drive-root.errors.unknown'),
      });
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    void refreshRootPath();
  }, []);

  return {
    rootPath,
    isUpdating,
    onChooseFolder,
  };
}

function showValidationNotification({ title, body }: NotificationMessagePops) {
  new Notification(title, { body });
}

function getChangeRootErrorMessage({
  errorCode,
  translate,
}: {
  errorCode: 'REMOVABLE_DEVICE' | 'OTHER_CLOUD_PROVIDER' | 'INSUFFICIENT_PERMISSION' | 'UNKNOWN';
  translate: (key: string) => string;
}) {
  if (errorCode === 'REMOVABLE_DEVICE') {
    return translate('settings.general.virtual-drive-root.errors.removable-device');
  }

  if (errorCode === 'OTHER_CLOUD_PROVIDER') {
    return translate('settings.general.virtual-drive-root.errors.other-cloud-provider');
  }

  if (errorCode === 'INSUFFICIENT_PERMISSION') {
    return translate('settings.general.virtual-drive-root.errors.insufficient-permission');
  }

  return translate('settings.general.virtual-drive-root.errors.unknown');
}
