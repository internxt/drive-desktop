import { DeviceBackups } from './DeviceBackups';

interface DeviceSettingsProps extends React.HTMLAttributes<HTMLBaseElement> {
  onGoToList: () => void;
  showDownloadFolders: () => void;
}

export function DeviceSettings({ onGoToList, className, showDownloadFolders }: DeviceSettingsProps) {
  return (
    <section className={className}>
      <DeviceBackups onGoToList={onGoToList} showDownloadFolders={showDownloadFolders} />
    </section>
  );
}
