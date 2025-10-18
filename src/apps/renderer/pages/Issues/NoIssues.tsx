import { useI18n } from '../../localize/use-i18n';

export function NoIssues() {
  const { translate } = useI18n();

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm font-medium text-gray-100">{translate('issues.no-issues')}</p>
    </div>
  );
}
