import { NodeJsEventBus } from '../../shared/infrastructure/NodeJsEventBus';
import { File } from '../domain/File';

export class CreateFilePlaceholderEmitter {
  private static readonly EVENT_NAME = 'PLACEHOLDER:CREATE:FILE';

  constructor(private readonly eventBus: NodeJsEventBus) {}

  emit(contentsId: File['contentsId']) {
    this.eventBus.emit(CreateFilePlaceholderEmitter.EVENT_NAME, { contentsId });
  }
}
