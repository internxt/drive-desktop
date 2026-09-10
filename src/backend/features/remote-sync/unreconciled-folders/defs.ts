/**
 * BR-2245
 * A placeholder move that keeps being requested with the same origin and destination has not
 * converged: if the previous one had worked, the origin would already be the destination. We
 * allow a generous amount of attempts because a move can also fail for transient reasons, like
 * the user holding a file open inside the folder.
 */
export const MAX_MOVE_ATTEMPTS = 10;
