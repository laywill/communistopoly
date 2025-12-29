/**
 * Base interface for all game services.
 * Services coordinate business logic across multiple slices.
 */
export interface GameService {
  /**
   * Service identifier for debugging
   */
  readonly name: string
}

/**
 * Type for the getter function that provides live store access.
 * Services receive this to read current state without circular dependencies.
 */
export type StoreGetter<T> = () => T

/**
 * Factory function type for creating services.
 * Services are created AFTER slices, receiving a getter to access the composed store.
 */
export type ServiceFactory<TStore, TService> = (
  get: StoreGetter<TStore>
) => TService

/**
 * Type representing all slices combined (without services).
 * This type is used by services to access slice methods without circular dependency.
 * It includes all slice state and actions that services need to access.
 */
export type SlicesStore = import('../store/slices').AllSlices
