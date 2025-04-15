import { FileMovedDomainEvent } from '../../files/domain/events/FileMovedDomainEvent';
import { FolderCreatedDomainEvent } from '../../folders/domain/events/FolderCreatedDomainEvent';
import { FolderRenamedDomainEvent } from '../../folders/domain/events/FolderRenamedDomainEvent';

export type AllowedEvents = FileMovedDomainEvent | FolderRenamedDomainEvent | FolderCreatedDomainEvent;
