import { useTranslationContext } from '../../context/LocalContext';

export function NoIssues() {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm font-medium text-gray-100">
        {translate('issues.no-issues')}
      </p>
    </div>
  );
}
