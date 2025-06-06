import React from 'react';
import { MigrationSlideProps } from '../helpers';
import { SideTextAnimation } from '../../Onboarding/helpers';

export const DeleteOldDriveFolderSlide: React.FC<MigrationSlideProps> = (props) => {
  return (
    <div className="flex h-full w-full">
      <SideTextAnimation display>
        <div className="flex w-full flex-col">
          <h1 className="mb-6 text-3xl font-semibold text-gray-100">{props.translate('migration.slides.delete-old-drive-folder.title')}</h1>
          <div className="flex flex-row">
            <h3 className="text-lg leading-tight text-gray-100">
              {props.translate('migration.slides.delete-old-drive-folder.message', {
                platform_app: props.translate('onboarding.common.platform-phrase.windows'),
              })}
            </h3>
          </div>
        </div>
      </SideTextAnimation>
    </div>
  );
};
