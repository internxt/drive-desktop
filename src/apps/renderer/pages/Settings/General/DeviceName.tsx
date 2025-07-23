import { useContext, useEffect, useState } from 'react';
import Spinner from '../../../assets/spinner.svg';
import { DeviceContext } from '../../../context/DeviceContext';
import { useTranslationContext } from '../../../context/LocalContext';
import Button from '../../../components/Button';
import TextInput from '../../../components/TextInput';

export default function DeviceName({
  onChangeView,
}: {
  onChangeView: boolean;
}) {
  const { translate } = useTranslationContext();
  const { deviceState, deviceRename } = useContext(DeviceContext);
  const [showEdit, setShowEdit] = useState(false);
  const [newName, setNewName] = useState<string | undefined>(undefined);
  const DEFAULT_DEVICE_NAME = 'Your Device';

  useEffect(() => {
    setShowEdit(false);
    setNewName(undefined);
  }, [onChangeView]);

  const validateName = (name: string) =>
    deviceState.status === 'SUCCESS' &&
    deviceState.device.name !== newName &&
    name.replace(/\s/g, '').length > 0;

  const setDeviceName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newName && validateName(newName)) {
      deviceRename(newName);
    }
    setShowEdit(false);
    setNewName(undefined);
  };

  const currentDeviceName =
    deviceState.status === 'SUCCESS' ? deviceState.device.name : '';

  return (
    <form
      onSubmitCapture={setDeviceName}
      className="flex flex-col items-center space-y-1.5 truncate"
      data-automation-id="deviceNameForm"
    >
      <p
        className="truncate text-sm font-medium leading-4 text-gray-80"
        data-automation-id="deviceNameSectionTitle"
      >
        {translate('settings.general.device.section')}
      </p>

      <div
        className={`flex h-9 items-center justify-center ${
          !showEdit ? 'truncate' : undefined
        }`}
        data-automation-id="deviceNameContainer"
      >
        {deviceState.status === 'ERROR' ? (
          <p
            className="truncate text-lg font-medium text-gray-100"
            data-automation-id="deviceNameDefault"
          >
            {DEFAULT_DEVICE_NAME}
          </p>
        ) : deviceState.status === 'LOADING' ? (
          <Spinner
            className="h-5 w-5 animate-spin"
            data-automation-id="deviceNameLoading"
          />
        ) : showEdit ? (
          <TextInput
            autoFocus={showEdit}
            onFocusCapture={(e) => {
              if (newName === undefined) {
                e.currentTarget.value = currentDeviceName;
              }
            }}
            onKeyUp={(e) => {
              if (e.key === 'Escape') {
                setShowEdit(false);
                setNewName(undefined);
              } else if (e.currentTarget.value.length > 0) {
                setNewName(e.currentTarget.value);
              }
            }}
            customClassName="h-9 w-80 text-center font-medium mb-px"
            placeholder={currentDeviceName}
            maxLength={30}
            data-automation-id="deviceNameEditInput"
          />
        ) : (
          <p
            className="truncate text-lg font-medium text-gray-100"
            data-automation-id="deviceNameDisplay"
          >
            {currentDeviceName}
          </p>
        )}
      </div>

      <div
        className="flex items-center space-x-2"
        data-automation-id="deviceNameActions"
      >
        {showEdit ? (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setShowEdit(false);
                setNewName(undefined);
              }}
              data-automation-id="deviceNameCancelButton"
            >
              {translate('settings.general.device.action.cancel')}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!validateName(newName ?? '')}
              data-automation-id="deviceNameSaveButton"
            >
              {translate('settings.general.device.action.save')}
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            size="md"
            disabled={
              deviceState.status === 'ERROR' || deviceState.status === 'LOADING'
            }
            onClick={() => setShowEdit(true)}
            data-automation-id="deviceNameEditButton"
          >
            {translate('settings.general.device.action.edit')}
          </Button>
        )}
      </div>
    </form>
  );
}
