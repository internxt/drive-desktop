import { useIssuesStore } from '../../pages/Issues/issues-store';
import { useSettingsStore } from '../../pages/Settings/settings-store';
import { IssuesPage } from '../../pages/Issues';
import Settings from '../../pages/Settings';
import { Widget } from '../../pages/Widget';
import { Dimensions, ISSUES, SETTINGS } from './get-dimensions';
import { DraggableModal } from './draggable-modal';
import { User } from '@/apps/main/types';

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
