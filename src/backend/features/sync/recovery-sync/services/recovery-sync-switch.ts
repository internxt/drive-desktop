/**
 * v2.7.2 Alexis Mora
 * The recovery that preserves local files stays off until it is validated on Windows,
 * so meanwhile the manual run keeps using the previous recovery.
 */
export const RecoverySyncSwitch = {
  isPreservationEnabled: () => false,
};
