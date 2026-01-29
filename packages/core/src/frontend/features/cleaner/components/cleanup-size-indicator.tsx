import { LocalContextProps } from '@/frontend/frontend.types';

import { formatFileSize } from '../service/format-file-size';

type Props = {
  selectedSize: number;
  totalSize: number;
  segmentDetails: Array<{ color: string; percentage: number; size: number }>;
  useTranslationContext: () => LocalContextProps;
};
export function CleanupSizeIndicator({ selectedSize, totalSize, segmentDetails, useTranslationContext }: Readonly<Props>) {
  const { translate } = useTranslationContext();
  return (
    <div className="bg-surface dark:bg-gray-5 flex w-1/2 flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">{translate('settings.cleaner.sizeIndicatorView.selectCategory')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{translate('settings.cleaner.sizeIndicatorView.previewContent')}</p>
      </div>

      <div className="relative mb-8 h-36 w-64">
        <svg className="h-full w-full" viewBox="0 0 200 120">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E5E7EB"
            className="dark:stroke-gray-600"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {segmentDetails.length > 0 && (
            <>
              {
                segmentDetails.reduce(
                  (acc, segment, index) => {
                    const radius = 80;
                    const semiCircumference = Math.PI * radius;
                    const strokeLength = (segment.percentage / 100) * semiCircumference;
                    const strokeDasharray = `${strokeLength} ${semiCircumference}`;
                    const strokeDashoffset = -acc.offset;

                    acc.elements.push(
                      <path
                        key={`segment-${index}`}
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 ease-in-out"
                      />,
                    );

                    acc.offset += strokeLength;
                    return acc;
                  },
                  { elements: [] as React.ReactNode[], offset: 0 },
                ).elements
              }
            </>
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '50px' }}>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatFileSize({ bytes: selectedSize })}</div>
          <SavedSpaceIndicator totalSize={totalSize} selectedSize={selectedSize} useTranslationContext={useTranslationContext} />
        </div>
      </div>
    </div>
  );
}

function SavedSpaceIndicator({
  totalSize,
  selectedSize,
  useTranslationContext,
}: Readonly<{
  totalSize: number;
  selectedSize: number;
  useTranslationContext: () => LocalContextProps;
}>) {
  const { translate } = useTranslationContext();
  const savedSpacePercentage = totalSize > 0 ? (selectedSize / totalSize) * 100 : 0;

  return (
    <div className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
      {translate('settings.cleaner.sizeIndicatorView.saveUpTo')} {savedSpacePercentage.toFixed(2)}%
      <br />
      {translate('settings.cleaner.sizeIndicatorView.ofYourSpace')}
    </div>
  );
}
