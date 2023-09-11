import { LocalItemMetaData } from './LocalItemMetaData';
import { RemoteItemMetaData } from './RemoteItemMetaData';
import { SynchronizedItemMetaData } from './SynchronizedItemMetaData';

export type Listing = Record<string, SynchronizedItemMetaData>;

export type LocalListing = Record<string, LocalItemMetaData>;

export type RemoteListing = Record<string, RemoteItemMetaData>;

export type PartialListing = LocalListing | RemoteListing;
