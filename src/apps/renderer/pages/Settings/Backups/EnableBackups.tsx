import DriveIcon from '../../../assets/backups/DriveIcon.svg';
import Button from '../../../components/Button';

interface EnableBackupsProps {
  enable: () => Promise<void>;
}

export function EnableBackups({ enable }: EnableBackupsProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <DriveIcon className="mt-6" />
      <h1 className="font-semibold">INTERNXT BACKUPS</h1>
      <p className="mb-6 text-center">
        Save a copy of your most important file on the cloud automatically
      </p>

      <Button onClick={enable}>Backup now</Button>
    </div>
  );
}
