// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GameState, Player, GamePhase, GulagReason, GameEndCondition, EliminationReason } from '../../types/game'
import type { DirectiveCard } from '../../data/partyDirectiveCards'
import type { TestQuestion } from '../../data/communistTestQuestions'
import type { GulagEscapeMethod } from '../../types/game'
import type { UiSlice } from '../slices/uiSlice'
import type { LogSlice } from '../slices/logSlice'
import type { StatisticsSlice } from '../slices/statisticsSlice'
import type { DiceSlice } from '../slices/diceSlice'
import type { TreasurySlice } from '../slices/treasurySlice'
import type { PlayerSlice } from '../slices/playerSlice'

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

  // Property management
  initializeProperties: () => void
  setPropertyCustodian: (spaceId: number, custodianId: string | null) => void
  updateCollectivizationLevel: (spaceId: number, level: number) => void
  purchaseProperty: (playerId: string, spaceId: number, price: number) => void
  payQuota: (payerId: string, custodianId: string, amount: number) => void
  mortgageProperty: (spaceId: number) => void
  unmortgageProperty: (spaceId: number, playerId: string) => void
  transferProperty: (propertyId: string, newCustodianId: string) => void

  // Turn management
  movePlayer: (playerId: string, spaces: number) => void
  resolveCurrentSpace: (playerId: string) => void
  finishMoving: () => void
  endTurn: () => void

  // Gulag management
  sendToGulag: (playerId: string, reason: GulagReason, justification?: string) => void
  demotePlayer: (playerId: string) => void
  checkRedStarExecutionAfterGulagRelease: (playerId: string) => void
  handleGulagTurn: (playerId: string) => void
  attemptGulagEscape: (playerId: string, method: GulagEscapeMethod, data?: Record<string, unknown>) => void
  checkFor10TurnElimination: (playerId: string) => void

  // Voucher system
  createVoucher: (prisonerId: string, voucherId: string) => void
  checkVoucherConsequences: (playerId: string, reason: GulagReason) => void
  expireVouchers: () => void

  // Trade system
  proposeTrade: (fromPlayerId: string, toPlayerId: string, items: { offering: import('../../types/game').TradeItems, requesting: import('../../types/game').TradeItems }) => void
  acceptTrade: (tradeId: string) => void
  rejectTrade: (tradeId: string) => void

  // Debt and liquidation
  createDebt: (debtorId: string, creditorId: string, amount: number, reason: string) => void
  checkDebtStatus: () => void

  // Elimination and ghosts
  eliminatePlayer: (playerId: string, reason: EliminationReason) => void
  checkElimination: (playerId: string) => boolean

  // Game end
  checkGameEnd: () => GameEndCondition | null
  endGame: (condition: GameEndCondition, winnerId: string | null) => void

  // Unanimous end vote
  initiateEndVote: (initiatorId: string) => void
  castEndVote: (playerId: string, vote: boolean) => void

  // Confessions
  submitConfession: (prisonerId: string, confession: string) => void
  reviewConfession: (confessionId: string, accepted: boolean) => void


  // STOY handling
  handleStoyPassing: (playerId: string) => void
  handleStoyPilfer: (playerId: string, diceRoll: number) => void

  // Card system
  drawPartyDirective: () => DirectiveCard
  drawCommunistTest: (difficulty?: 'easy' | 'medium' | 'hard' | 'trick') => TestQuestion
  applyDirectiveEffect: (card: DirectiveCard, playerId: string) => void
  answerCommunistTest: (question: TestQuestion, answer: string, readerId: string) => void

  // Piece abilities
  tankRequisition: (tankPlayerId: string, targetPlayerId: string) => void
  sickleHarvest: (sicklePlayerId: string, targetPropertyId: number) => void
  ironCurtainDisappear: (ironCurtainPlayerId: string, targetPropertyId: number) => void
  leninSpeech: (leninPlayerId: string, applauders: string[]) => void
  promotePlayer: (playerId: string) => void

  // Property special abilities
  siberianCampsGulag: (custodianId: string, targetPlayerId: string) => void
  approveHammerAbility: (custodianId: string, targetPlayerId: string, approved: boolean) => void
  kgbPreviewTest: (custodianId: string) => void
  ministryTruthRewrite: (custodianId: string, newRule: string) => void
  approveMinistryTruthRewrite: (custodianId: string, newRule: string, approved: boolean) => void
  pravdaPressRevote: (custodianId: string, decision: string) => void

  // Treasury
  adjustTreasury: (amount: number) => void

  // Denouncement and Tribunal
  canPlayerDenounce: (playerId: string) => { canDenounce: boolean, reason: string }
  initiateDenouncement: (accuserId: string, accusedId: string, crime: string) => void
  advanceTribunalPhase: () => void
  addWitness: (witnessId: string, side: 'for' | 'against') => void
  renderTribunalVerdict: (verdict: import('../../types/game').TribunalVerdict) => void
  getWitnessRequirement: (playerId: string) => import('../../types/game').WitnessRequirement

  // Special Decrees
  initiateGreatPurge: () => void
  voteInGreatPurge: (voterId: string, targetId: string) => void
  resolveGreatPurge: () => void
  initiateFiveYearPlan: (target: number, durationMinutes: number) => void
  contributeToFiveYearPlan: (playerId: string, amount: number) => void
  resolveFiveYearPlan: () => void
  grantHeroOfSovietUnion: (playerId: string) => void
  isHeroOfSovietUnion: (playerId: string) => boolean
}

// Combined GameStore type - includes all slices
export type GameStore = GameState & GameActions & UiSlice & LogSlice & StatisticsSlice & DiceSlice & TreasurySlice & PlayerSlice
