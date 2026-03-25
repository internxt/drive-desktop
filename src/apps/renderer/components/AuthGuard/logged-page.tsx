import { User } from '@/apps/main/types';
import { IssuesPage } from '../../pages/Issues';
import { useIssuesStore } from '../../pages/Issues/issues-store';
import Settings from '../../pages/Settings';
import { useSettingsStore } from '../../pages/Settings/settings-store';
import { Widget } from '../../pages/Widget';
import { DraggableModal } from './draggable-modal';
import { Dimensions, ISSUES, SETTINGS } from './get-dimensions';

type Props = {
  user: User;
  workArea: Dimensions | undefined;
};

export function LoggedPage({ user, workArea }: Props) {
  const { activeSection: settingsSection } = useSettingsStore();
  const { activeSection: issuesSection } = useIssuesStore();

  return (
    <>
      <Widget user={user} />

      {settingsSection && (
        <DraggableModal workArea={workArea} dimensions={SETTINGS}>
          <Settings user={user} activeSection={settingsSection} />
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
