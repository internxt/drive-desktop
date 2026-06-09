import { useEffect, useState } from 'react';

export default function useVirtualDriveRootPicker() {
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
      if (!selectedPath) {
        return;
      }

      await refreshRootPath();
    } catch (error) {
      window.electron.logger.error({
        msg: '[SETTINGS][GENERAL] Failed to update virtual drive root folder',
        error,
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
