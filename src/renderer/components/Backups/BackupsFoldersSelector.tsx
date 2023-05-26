import React from 'react';
import BackupsList from 'renderer/pages/Settings/Backups/List';

export interface BackupsFoldersSelectorProps {
  onFinish: () => void;
  onCancel: () => void;
}

export const BackupsFoldersSelector: React.FC<BackupsFoldersSelectorProps> = (
  props
) => {
  return (
    <div className="backups-modal-shadow rounded-lg bg-white px-5 py-5">
      <BackupsList onGoToPanel={props.onFinish} onCancel={props.onCancel} />
    </div>
  );
};
