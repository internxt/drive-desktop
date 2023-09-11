import { DependencyContainer } from '../dependencyInjection/DependencyContainer';
import { AddFileCallback } from './callbacks/AddFileCallback';

export function buildCallbacks(container: DependencyContainer) {
  const addFileCallback = new AddFileCallback(
    container.contentsUploader,
    container.filePathFromAbsolutePathCreator,
    container.fileCreator
  );

  return {
    addFile: addFileCallback,
  } as const;
}
