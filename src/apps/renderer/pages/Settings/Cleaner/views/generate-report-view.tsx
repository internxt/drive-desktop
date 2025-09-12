import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
type Props = {
  onGenerateReport: () => void;
};

export function GenerateReportView({ onGenerateReport }: Props) {
  const { translate } = useTranslationContext();
  return (
    <div
      className="flex flex-col items-center p-5"
      data-testid="generate-report-container"
    >
      <div
        className="flex flex-col items-center gap-4 text-center"
        data-testid="generate-report-content"
      >
        <div className="flex flex-col">
          <p className="font-medium text-gray-100">
            {translate('settings.cleaner.generateReportView.title')}
          </p>
          <p className="text-sm text-gray-80">
            {translate('settings.cleaner.generateReportView.description')}
          </p>
        </div>
        <Button onClick={onGenerateReport} className="w-max">
          {translate('settings.cleaner.generateReportView.generateReport')}
        </Button>
      </div>
    </div>
  );
}
