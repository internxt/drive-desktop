import { useContext } from 'react';
import Button from '../../../components/Button';
import { ActualDeviceContext } from '../../../context/ActualDeviceContext';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement>;

export function DownloadBackup({ className }: ViewBackupsProps) {
  const { selected } = useContext(ActualDeviceContext);

  const handleDownloadBackup = async () => {
    try {
      await window.electron.downloadBackup(selected);
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <>
      <Button
        className={`${className} hover:cursor-pointer`}
        variant="secondary"
        onClick={handleDownloadBackup}
      >
        Download
      </Button>
    </>
  );
}
