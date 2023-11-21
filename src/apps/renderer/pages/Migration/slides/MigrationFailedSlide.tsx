import React from 'react';
import { MigrationSlideProps } from '../helpers';
import { XCircle } from 'phosphor-react';
import { SideTextAnimation } from '../../Onboarding/helpers';
import Button from '../../../components/Button';

export type MigrationFailedSlideProps = MigrationSlideProps;

export const MigrationFailedSlide: React.FC<MigrationFailedSlideProps> = (
  props
) => {
  return (
    <div className="flex h-full w-full">
      <SideTextAnimation display>
        <div className="flex w-full flex-col">
          <h1 className="mb-6 text-3xl font-semibold text-gray-100">
            {props.translate('migration.slides.migration-failed.title')}
          </h1>
          <div className="flex flex-row">
            <div className="grow-0">
              <XCircle weight="fill" className="mr-2 h-5 w-5" color="red" />
            </div>
            <div>
              <h3 className="text-lg font-medium leading-[20px]">
                {props.translate('migration.slides.migration-failed.message')}
              </h3>
              <h4 className="font-regular mt-0.5 text-base text-gray-50">
                {props.translate(
                  'migration.slides.migration-failed.description'
                )}
              </h4>
              <Button
                variant="secondary"
                onClick={props.onShowFailedItems}
                className="mt-3 h-10"
              >
                {props.translate(
                  'migration.slides.migration-failed.show-files'
                )}
              </Button>
            </div>
          </div>
        </div>
      </SideTextAnimation>
    </div>
  );
};
