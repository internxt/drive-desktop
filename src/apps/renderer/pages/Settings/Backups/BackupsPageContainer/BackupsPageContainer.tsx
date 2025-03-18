import { type FC, useContext } from 'react';
import { DeviceContext } from '../../../../context/DeviceContext';
import Spinner from '../../../../assets/spinner.svg';
import { DevicesList } from '../DevicesList';
import { ScrollableContent } from '../../../../components/ScrollableContent';
import { DeviceSettings } from '../DeviceSettings';

interface Props {
  showBackedFolders: () => void;
  showIssues: () => void;
}

export const BackupsPageContainer: FC<Props> = ({ showBackedFolders, showIssues }) => {
  const { deviceState } = useContext(DeviceContext);
  return (
    <>
      {deviceState.status === 'LOADING' && (
        <div className="flex h-32 items-center justify-center">
          <Spinner className=" fill-neutral-500 h-9 w-9 animate-spin" />
        </div>
      )}
      {deviceState.status === 'ERROR' && (
        <div className="flex h-32 items-center justify-center">
          <p className="text-red-60 text-sm">
            There was an error loading your backups
          </p>
        </div>
      )}
      {deviceState.status === 'SUCCESS' && (
        <section className="flex h-full">
          <DevicesList className="w-1/3" />
          <div className="mx-4 border-l border-gray-10"></div>
          <ScrollableContent className="w-2/3">
            <DeviceSettings
              onGoToList={showBackedFolders}
              showIssues={showIssues}
            />
          </ScrollableContent>
        </section>
      )}
    </>
  );
};
