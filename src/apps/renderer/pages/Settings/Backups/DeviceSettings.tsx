import { DeviceBackups } from './DeviceBackups';

interface DeviceSettingsProps extends React.HTMLAttributes<HTMLBaseElement> {
  onGoToList: () => void;
  showIssues: () => void;
  showDownloadFolers: () => void;
}

export function DeviceSettings({ onGoToList, className, showIssues, showDownloadFolers }: DeviceSettingsProps) {
  return (
    <section className={className}>
      <DeviceBackups onGoToList={onGoToList} showIssues={showIssues} showDownloadFolers={showDownloadFolers} />
    </section>
  );
}
