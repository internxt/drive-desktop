import { ContentsContainer } from './contents/ContentsContainer';
import { FilesContainer } from './files/FilesContainer';
import { FoldersContainer } from './folders/FoldersContainer';
import { SharedContainer } from './shared/SharedContainer';
import { TreeContainer } from './tree/TreeContainer';

export interface DependencyContainer
  extends TreeContainer,
    FilesContainer,
    FoldersContainer,
    ContentsContainer,
    SharedContainer {}
