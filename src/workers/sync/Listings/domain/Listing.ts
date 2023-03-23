import { LocalItemMetaData } from './LocalItemMetaData';
import { RemoteItemMetaData } from './RemoteItemMetaData';
import {
  SynchronizedItemMetaData,
  SynchronizeMetaDataAttributes,
} from './SynchronizedItemMetaData';

export type Listing = Record<string, SynchronizedItemMetaData>;

export type SerializedListing = Record<string, SynchronizeMetaDataAttributes>;

export type LocalListing = Record<string, LocalItemMetaData>;

export type RemoteListing = Record<string, RemoteItemMetaData>;

export type PartialListing = Record<
  string,
  LocalItemMetaData | RemoteItemMetaData
>;
