import { ReactNode } from 'react';
import Draggable from 'react-draggable';
import { Dimensions, getDimensions } from './get-dimensions';

type Props = {
  children: ReactNode;
  workArea: Dimensions | undefined;
  dimensions: Dimensions;
};

export function DraggableModal({ workArea, dimensions, children }: Props) {
  if (!workArea) return null;

  const data = getDimensions({ workArea, dimensions });

  return (
    <Draggable handle=".draggable-handle" defaultPosition={data.positions} bounds={data.bounds} defaultClassName="absolute">
      <div
        className="rounded-shadow-white bg-surface dark:bg-gray-1"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}>
        {children}
      </div>
    </Draggable>
  );
}
