// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GameState } from '../types/game'

/**
 * Type-safe store getter for services.
 * Services use this to access the current live state.
 */
export type StoreGetter = () => GameState

/**
 * Base interface for game services.
 * Services contain business logic and coordinate between slices.
 * They are stateless and depend on the game store through a getter function.
 */
export interface GameService {
  /** Getter function to access the live game store */
  getStore: StoreGetter
}
