// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GameState } from '../types/game'

/**
 * Base interface for game services.
 * Services contain business logic and coordinate between slices.
 * They are stateless and depend on the game store.
 */
export interface GameService {
  /** Reference to the game store */
  store: GameState
}

/**
 * Type-safe store getter for services.
 * Services use this to access the current state.
 */
export type StoreGetter = () => GameState
