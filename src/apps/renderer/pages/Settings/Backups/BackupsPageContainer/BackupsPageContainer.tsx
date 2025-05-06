import { type FC, useContext } from 'react';
import { DeviceContext } from '../../../../context/DeviceContext';
import DeviceBackupsDetailsView from '../DeviceBackupsDetailsView/DeviceBackupsDetailsView';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner';
import { useTranslationContext } from '../../../../context/LocalContext';

interface Props {
  showBackedFolders: () => void;
  showIssues: () => void;
}

export const BackupsPageContainer: FC<Props> = ({ showBackedFolders, showIssues }) => {
  const { deviceState } = useContext(DeviceContext);
  const { translate } = useTranslationContext();

  return (
    <>
      {deviceState.status === 'LOADING' && (
        <LoadingSpinner/>
      )}
      {deviceState.status === 'ERROR' && (
        <div className="flex h-32 items-center justify-center">
          <p className="text-red-60 text-sm">
            {translate('settings.backups.error-loading-backups')}
          </p>
        </div>
      )}
      {deviceState.status === 'SUCCESS' && (
        <section className="flex h-full">
          <DeviceBackupsDetailsView
            showBackedFolders={showBackedFolders}
            showIssues={showIssues}
          />
        </section>
      )}
    </>
  );
};
