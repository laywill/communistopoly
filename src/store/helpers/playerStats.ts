// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { PlayerStatistics } from '../../types/game'
import { INITIAL_MAX_WEALTH } from '../constants'

export function initializePlayerStats (): PlayerStatistics {
  return {
    turnsPlayed: 0,
    denouncementsMade: 0,
    denouncementsReceived: 0,
    tribunalsWon: 0,
    tribunalsLost: 0,
    totalGulagTurns: 0,
    gulagEscapes: 0,
    moneyEarned: 0,
    moneySpent: 0,
    propertiesOwned: 0,
    maxWealth: INITIAL_MAX_WEALTH,
    testsPassed: 0,
    testsFailed: 0
  }
}
