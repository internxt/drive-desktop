import { BackupsPageContainer } from './BackupsPageContainer/BackupsPageContainer';
import { useContext } from 'react';
import { BackupContext } from '../../../context/BackupContext';
import { useUserAvailableProducts } from '../../../hooks/useUserAvailableProducts/useUserAvailableProducts';
import { LockedState } from '../Antivirus/views/LockedState';

interface BackupsSectionProps {
  active: boolean;
  showBackedFolders: () => void;
  showIssues: () => void;
}

export default function BackupsSection({
  active,
  showBackedFolders,
  showIssues,
}: BackupsSectionProps) {
  const { backups } = useContext(BackupContext);
  const { products } = useUserAvailableProducts();

  const userCanAccessBackups = backups.length > 0 || products?.backups;

  return (
    <div className={`${active ? 'block' : 'hidden'} w-full`}>
      {userCanAccessBackups ? (
        <BackupsPageContainer
          showBackedFolders={showBackedFolders}
          showIssues={showIssues}
        />
      ): (
        <LockedState />
      )}
    </div>
  );
}
