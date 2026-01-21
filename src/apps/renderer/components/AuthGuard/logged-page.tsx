import { useIssuesStore } from '../../pages/Issues/issues-store';
import { useSettingsStore } from '../../pages/Settings/settings-store';
import { IssuesPage } from '../../pages/Issues';
import Settings from '../../pages/Settings';
import { Widget } from '../../pages/Widget';
import { Dimensions, ISSUES, SETTINGS } from './get-dimensions';
import { DraggableModal } from './draggable-modal';

type Props = {
  workArea: Dimensions | undefined;
};

export function LoggedPage({ workArea }: Props) {
  const { activeSection: settingsSection } = useSettingsStore();
  const { activeSection: issuesSection } = useIssuesStore();

  return (
    <>
      <Widget />

      {settingsSection && (
        <DraggableModal workArea={workArea} dimensions={SETTINGS}>
          <Settings activeSection={settingsSection} />
        </DraggableModal>
      )}

      {issuesSection && (
        <DraggableModal workArea={workArea} dimensions={ISSUES}>
          <IssuesPage activeSection={issuesSection} />
        </DraggableModal>
      )}
    </>
  );
}
