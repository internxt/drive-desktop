import { Button } from '@/frontend/components/button';
import { LocalContextProps } from '@/frontend/frontend.types';

type Props = {
  onGenerateReport: () => void;
  useTranslationContext: () => LocalContextProps;
};

export function GenerateReportView({ onGenerateReport, useTranslationContext }: Readonly<Props>) {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center" data-testid="generate-report-container">
      <div className="flex flex-col gap-2">
        <p className="text-xl font-semibold text-gray-100">{translate('settings.cleaner.generateReportView.title')}</p>
        <p className="text-gray-80 text-sm">{translate('settings.cleaner.generateReportView.description')}</p>
      </div>
      <Button onClick={onGenerateReport} className="w-max">
        {translate('settings.cleaner.generateReportView.generateReport')}
      </Button>
    </div>
  );
}
