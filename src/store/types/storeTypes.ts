// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GameState, Player, GamePhase, GameEndCondition } from '../../types/game'
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

// Game Actions interface - all store methods
export interface GameActions {
  // Game phase management
  setGamePhase: (phase: GamePhase) => void
  startNewGame: () => void
  resetGame: () => void

  // Player management
  initializePlayers: (playerSetups: { name: string, piece: Player['piece'], isStalin: boolean }[]) => void
  setCurrentPlayer: (index: number) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void

  // Property management (payQuota remains in GameActions as it's a payment action, not property state)
  payQuota: (payerId: string, custodianId: string, amount: number) => void

  // Turn management - moved to MovementSlice
  // movePlayer, resolveCurrentSpace, finishMoving, endTurn are now in MovementSlice

  // Gulag management - moved to GulagSlice
  // sendToGulag, checkRedStarExecutionAfterGulagRelease, handleGulagTurn, attemptGulagEscape, checkFor10TurnElimination are now in GulagSlice
  demotePlayer: (playerId: string) => void

  // Voucher system - moved to VoucherSlice
  // createVoucher, checkVoucherConsequences, expireVouchers are now in VoucherSlice

  // Confession system - moved to ConfessionSlice
  // submitConfession, reviewConfession are now in ConfessionSlice

  // Trade system - moved to TradeSlice
  // proposeTrade, acceptTrade, rejectTrade are now in TradeSlice

  // Debt and liquidation - moved to DebtSlice
  // createDebt, checkDebtStatus, eliminatePlayer, checkElimination are now in DebtSlice

  // Game end
  checkGameEnd: () => GameEndCondition | null
  endGame: (condition: GameEndCondition, winnerId: string | null) => void

  // Unanimous end vote
  initiateEndVote: (initiatorId: string) => void
  castEndVote: (playerId: string, vote: boolean) => void

  // STOY handling - moved to MovementSlice
  // handleStoyPassing, handleStoyPilfer are now in MovementSlice

  // Card system - moved to CardSlice
  // drawPartyDirective, drawCommunistTest, applyDirectiveEffect, answerCommunistTest are now in CardSlice

  // Piece abilities - moved to PieceAbilitiesSlice
  // tankRequisition, sickleHarvest, ironCurtainDisappear, leninSpeech are now in PieceAbilitiesSlice

  // Property special abilities - moved to PropertyAbilitiesSlice
  // siberianCampsGulag, approveHammerAbility, kgbPreviewTest, ministryTruthRewrite,
  // approveMinistryTruthRewrite, pravdaPressRevote are now in PropertyAbilitiesSlice

  // Treasury
  adjustTreasury: (amount: number) => void

  // Denouncement and Tribunal - moved to TribunalSlice
  // canPlayerDenounce, initiateDenouncement, advanceTribunalPhase, addWitness, renderTribunalVerdict, getWitnessRequirement are now in TribunalSlice

  // Special Decrees - moved to SpecialDecreesSlice
  // initiateGreatPurge, voteInGreatPurge, resolveGreatPurge, initiateFiveYearPlan, contributeToFiveYearPlan, resolveFiveYearPlan, grantHeroOfSovietUnion, isHeroOfSovietUnion are now in SpecialDecreesSlice
}

// Combined GameStore type - includes all slices
export type GameStore = GameState & GameActions & UiSlice & LogSlice & StatisticsSlice & DiceSlice & TreasurySlice & PlayerSlice & PropertySlice & MovementSlice & GulagSlice & VoucherSlice & ConfessionSlice & TradeSlice & DebtAndEliminationSlice & TribunalSlice & SpecialDecreesSlice & CardSlice & PieceAbilitiesSlice & PropertyAbilitiesSlice
