// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GameState } from '../../types/game'
import type { UiSlice } from '../slices/uiSlice'
import type { LogSlice } from '../slices/logSlice'
import type { StatisticsSlice } from '../slices/statisticsSlice'
import type { DiceSlice } from '../slices/diceSlice'
import type { TreasurySlice } from '../slices/treasurySlice'
import type { PlayerSlice } from '../slices/playerSlice'
import type { PropertySlice } from '../slices/propertySlice'
import type { MovementSlice } from '../slices/movementSlice'
import type { GulagSlice } from '../slices/gulagSlice'
import type { VoucherSlice } from '../slices/voucherSlice'
import type { ConfessionSlice } from '../slices/confessionSlice'
import type { TradeSlice } from '../slices/tradeSlice'
import type { DebtAndEliminationSlice } from '../slices/debtAndEliminationSlice'
import type { TribunalSlice } from '../slices/tribunalSlice'
import type { SpecialDecreesSlice } from '../slices/specialDecreesSlice'
import type { CardSlice } from '../slices/cardSlice'
import type { PieceAbilitiesSlice } from '../slices/pieceAbilitiesSlice'
import type { PropertyAbilitiesSlice } from '../slices/propertyAbilitiesSlice'
import type { GameEndSlice } from '../slices/gameEndSlice'
import type { GamePhaseSlice } from '../slices/gamePhaseSlice'

// Game Actions interface - preserved for backward compatibility.
// All actions have been migrated to their respective slice interfaces;
// this interface is now an empty marker kept for any consumers that import the type.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GameActions {}

// Combined GameStore type - intersection of all slice types and base game state
export type GameStore =
  GameState &
  GameActions &
  // Foundation slices
  UiSlice &
  LogSlice &
  StatisticsSlice &
  DiceSlice &
  TreasurySlice &
  // Core entity slices
  PlayerSlice &
  PropertySlice &
  MovementSlice &
  // Social/gulag slices
  GulagSlice &
  VoucherSlice &
  ConfessionSlice &
  // Economic slices
  TradeSlice &
  DebtAndEliminationSlice &
  // Social system slices
  TribunalSlice &
  SpecialDecreesSlice &
  // Content slices
  CardSlice &
  PieceAbilitiesSlice &
  PropertyAbilitiesSlice &
  // Game flow slices
  GameEndSlice &
  GamePhaseSlice
