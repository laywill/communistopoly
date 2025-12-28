// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

/**
 * Helper type for accessing the full game store from within slices.
 * This works around the circular dependency issue where slices need to call
 * methods from other slices, but TypeScript doesn't know the full store type
 * during slice creation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type StoreGetter = () => any

/**
 * Type-safe wrapper for calling cross-slice methods.
 * Use this when a slice needs to call a method from another slice.
 *
 * @example
 * const store = getStore(get)
 * store.addLogEntry({ type: 'system', message: 'Hello' })
 */
export function getStore(get: StoreGetter): any {
  return get()
}

/**
 * Alternative: Add eslint-disable comment for cross-slice calls.
 * This is the pattern used in existing slices like gulagSlice.
 *
 * @example
 * // eslint-disable-next-line @typescript-eslint/no-unsafe-call
 * get().addLogEntry({ type: 'system', message: 'Hello' })
 */
