// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

// ── Board Layout ──────────────────────────────────────────────────────────────
export const BOARD_SIZE = 40
export const CORNER_STOY = 0
export const CORNER_GULAG = 10
export const CORNER_BREADLINE = 20
export const CORNER_ENEMY_OF_STATE = 30

/** Board positions of the four Railway stations */
export const RAILWAY_SPACE_IDS = [5, 15, 25, 35] as const

/** Collective Farm property space IDs (Tank cannot control these) */
export const COLLECTIVE_FARM_SPACE_IDS = [6, 8, 9] as const

// ── Economy ───────────────────────────────────────────────────────────────────
export const STARTING_RUBLES = 1500
export const STOY_TRAVEL_TAX = 200
export const HAMMER_STOY_BONUS = 50
export const PILFER_AMOUNT = 100
export const PILFER_DICE_THRESHOLD = 4
export const GULAG_ESCAPE_COST = 500
export const MORTGAGE_VALUE_RATIO = 0.5
export const UNMORTGAGE_COST_RATIO = 0.6

// ── Piece Abilities ───────────────────────────────────────────────────────────
export const BREAD_LOAF_WEALTH_CAP = 1000

// ── Gameplay Thresholds ───────────────────────────────────────────────────────
export const THREE_DOUBLES_THRESHOLD = 3
export const GULAG_TIMEOUT_TURNS = 10
export const VOUCHER_EXPIRY_ROUNDS = 3
export const MAX_LOG_ENTRIES = 50

// ── Wealth Calculation ────────────────────────────────────────────────────────
export const IMPROVEMENT_VALUE = 50
export const INITIAL_MAX_WEALTH = 1500
