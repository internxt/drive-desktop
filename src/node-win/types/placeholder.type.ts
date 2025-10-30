export enum PinState {
  /**
   * The user hasn't made a decision.
   * The client or platform may hydrate or dehydrate as they see fit.
   * New remote files in unspecified directories start unspecified, and dehydrated (which is an arbitrary decision).
   */
  Unspecified = 0,

  /**
   * The file shall be available and up to date locally. Also known as "pinned".
   * Pinned dehydrated files shall be hydrated as soon as possible.
   */
  AlwaysLocal = 1,

  /**
   * File shall be a dehydrated placeholder, filled on demand.
   * Also known as "unpinned". Unpinned hydrated files shall be dehydrated as soon as possible.
   * If a unpinned file becomes hydrated
   * (such as due to an implicit hydration where the user requested access to the file's data)
   * Its pin state changes to Unspecified.
   */
  OnlineOnly = 2,

  /**
   * The file will never be synced to the cloud.
   * Useful for ignored files to indicate to the OS the file will never besynced
   */
  Excluded = 3,

  /**
   * The pin state is derived from the state of the parent folder.
   * For example new remote files start out in this state, following the state of their parent folder.
   * This state is used purely for resetting pin states to their derived value.
   * The effective state for an item will never be "Inherited".
   */
  Inherited = 4,
}
