import { DeviceBackups } from './DeviceBackups';

interface DeviceSettingsProps extends React.HTMLAttributes<HTMLBaseElement> {
  onGoToList: () => void;
  showDownloadFolers: () => void;
}

export function DeviceSettings({ onGoToList, className, showDownloadFolers }: DeviceSettingsProps) {
  return (
    <section className={className}>
      <DeviceBackups onGoToList={onGoToList} showDownloadFolers={showDownloadFolers} />
    </section>
  );
}
