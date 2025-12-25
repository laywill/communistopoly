// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

export type SpaceType = 'property' | 'railway' | 'utility' | 'tax' | 'card' | 'corner'

export type PropertyGroup =
  | 'siberian' // Brown - Siberian Work Camps
  | 'collective' // Light Blue - Collective Farms
  | 'industrial' // Pink - Industrial Centers
  | 'ministry' // Orange - Government Ministries
  | 'military' // Red - Military Installations
  | 'media' // Yellow - State Media
  | 'elite' // Green - Party Elite District
  | 'kremlin' // Dark Blue - Kremlin Complex
  | 'railroad' // Railways
  | 'utility' // Utilities

export type CardType = 'party-directive' | 'communist-test'

export interface BoardSpace {
  id: number
  name: string
  russianName?: string
  type: SpaceType
  group?: PropertyGroup
  baseQuota?: number
  baseCost?: number
  cardType?: CardType
  specialRule?: string
}

export interface PropertySpace extends BoardSpace {
  type: 'property'
  group: PropertyGroup
  baseQuota: number
  baseCost: number
}

export interface RailwaySpace extends BoardSpace {
  type: 'railway'
  group: 'railroad'
}

export interface UtilitySpace extends BoardSpace {
  type: 'utility'
  group: 'utility'
}

export interface TaxSpace extends BoardSpace {
  type: 'tax'
  amount: number
}

export interface CardSpace extends BoardSpace {
  type: 'card'
  cardType: CardType
}

export interface CornerSpace extends BoardSpace {
  type: 'corner'
  cornerType: 'stoy' | 'gulag' | 'breadline' | 'enemy-of-state'
}

// Player-related types
export type PartyRank = 'proletariat' | 'partyMember' | 'commissar' | 'innerCircle'

export type PieceType = 'hammer' | 'sickle' | 'redStar' | 'tank' | 'breadLoaf' | 'ironCurtain' | 'vodkaBottle' | 'statueOfLenin'

// Gulag entry reasons
export type GulagReason =
  | 'enemyOfState' // Landed on Enemy of the State
  | 'threeDoubles' // Rolled three consecutive doubles
  | 'denouncementGuilty' // Found guilty in tribunal
  | 'debtDefault' // Failed to pay debt within one round
  | 'pilferingCaught' // Caught stealing at STOY
  | 'stalinDecree' // Stalin sent you (with justification)
  | 'railwayCapture' // Caught "fleeing motherland"
  | 'campLabour' // Sent by Siberian Camp custodian
  | 'voucherConsequence' // Voucher went to Gulag due to vouchee's offence

// Elimination reasons
export type EliminationReason =
  | 'bankruptcy' // Can't pay debt, no assets
  | 'execution' // Stalin executed
  | 'gulagTimeout' // 10 turns in Gulag
  | 'redStarDemotion' // Red Star fell to Proletariat
  | 'unanimous' // All players + Stalin voted

export interface Player {
  id: string
  name: string
  piece: PieceType | null // null for Stalin
  rank: PartyRank
  rubles: number
  position: number
  properties: string[] // property IDs
  inGulag: boolean
  gulagTurns: number
  isEliminated: boolean
  isStalin: boolean

  // Elimination tracking
  eliminationReason?: EliminationReason
  eliminationTurn?: number
  finalWealth?: number
  finalRank?: PartyRank
  finalProperties?: number

  // Tracking for rank progression
  correctTestAnswers: number
  consecutiveFailedTests: number
  underSuspicion: boolean

  // Property system
  skipNextTurn: boolean // For Industrial Centers conscripted labour
  usedRailwayGulagPower: boolean // All four railways special power

  // Property special abilities
  hasUsedSiberianCampsGulag: boolean // Siberian Camps: Send to Gulag ability used
  kgbTestPreviewsUsedThisRound: number // KGB Headquarters: Test previews used this round
  hasUsedMinistryTruthRewrite: boolean // Ministry of Truth: Rewrite rule ability used
  hasUsedPravdaPressRevote: boolean // Pravda Press: Force re-vote ability used

  // Gulag system
  vouchingFor: string | null // Player ID they vouched for
  vouchedByRound: number | null // Round number when vouch expires

  // Debt system
  debt: Debt | null
  debtCreatedAtRound: number | null

  // Piece abilities
  hasUsedTankGulagImmunity: boolean // Tank: First Gulag immunity used
  tankRequisitionUsedThisLap: boolean // Tank: Requisition used this lap
  lapsCompleted: number // Track laps around board (for Tank requisition)
  hasUsedSickleHarvest: boolean // Sickle: Harvest ability used
  sickleMotherlandForgotten: boolean // Sickle: Forgot to say "For the Motherland!"
  hasUsedLeninSpeech: boolean // Lenin: Inspiring speech used
  hasUsedIronCurtainDisappear: boolean // Iron Curtain: Disappear property used
  hasFreeFromGulagCard: boolean // Owns a "Get out of Gulag free" card
  vodkaUseCount: number // Vodka: Track sobriety level
  ironCurtainClaimedRubles: number // Iron Curtain: Last claimed amount (for audits)
  owesFavourTo: string[] // Breadline: Player IDs they owe favours to
}

export interface Property {
  spaceId: number
  custodianId: string | null // null = owned by State
  collectivizationLevel: number // 0-5 (0=none, 5=People's Palace)
  mortgaged: boolean
}

// Voucher system
export interface VoucherAgreement {
  id: string
  prisonerId: string
  voucherId: string
  expiresAtRound: number // Current round + 3
  isActive: boolean
}

// Debt system
export interface Debt {
  id: string
  debtorId: string
  creditorId: string // Can be a player ID or 'state' for taxes, property purchases
  amount: number
  createdAtRound: number
  reason: string
}

// Game phases
export type GamePhase = 'welcome' | 'setup' | 'playing' | 'ended'
export type TurnPhase = 'pre-roll' | 'rolling' | 'moving' | 'resolving' | 'post-turn'

// Game log
export type LogEntryType = 'movement' | 'payment' | 'gulag' | 'rank' | 'property' | 'tribunal' | 'system' | 'dice'

export interface LogEntry {
  id: string
  timestamp: Date
  type: LogEntryType
  message: string
  playerId?: string
}

// Pending actions
export type PendingActionType =
  | 'stoy-pilfer'
  | 'property-purchase'
  | 'quota-payment'
  | 'railway-fee'
  | 'utility-fee'
  | 'tax-payment'
  | 'draw-party-directive'
  | 'draw-communist-test'
  | 'party-directive-effect'
  | 'communist-test-answer'
  | 'collective-farm-announcement'
  | 'gulag-escape-choice'
  | 'voucher-request'
  | 'inform-on-player'
  | 'bribe-stalin'
  | 'liquidation-required'
  | 'sickle-harvest'
  | 'iron-curtain-disappear'
  | 'lenin-speech'
  | 'vodka-roll'
  | 'breadline-contribution'
  | 'breadline-response'
  | 'sickle-motherland-announcement'
  | 'bread-loaf-begging'
  | 'trade-offer'
  | 'trade-response'
  | 'write-confession'
  | 'review-confession'

export interface PendingAction {
  type: PendingActionType
  data?: Record<string, unknown>
}

// Gulag escape methods
export type GulagEscapeMethod =
  | 'roll' // Roll for doubles
  | 'pay' // Pay 500₽
  | 'vouch' // Request voucher
  | 'inform' // Inform on another
  | 'bribe' // Bribe Stalin
  | 'card' // Use "Get out of Gulag free" card

// Bribe request
export interface BribeRequest {
  id: string
  playerId: string
  amount: number
  reason: string // For gulag escape, property influence, etc.
  timestamp: Date
}

// Trade system
export interface TradeOffer {
  id: string
  fromPlayerId: string
  toPlayerId: string
  offering: TradeItems
  requesting: TradeItems
  status: 'pending' | 'accepted' | 'rejected'
  timestamp: Date
}

export interface TradeItems {
  rubles: number
  properties: string[] // property space IDs
  gulagCards: number // Number of "Get out of Gulag free" cards
  favours: number // Number of favours owed
}

// Game End conditions
export type GameEndCondition =
  | 'survivor' // One player remains
  | 'stalinWins' // All players eliminated
  | 'timeout' // 3+ hours passed
  | 'unanimous' // Players voted to end

// Player statistics
export interface PlayerStatistics {
  turnsPlayed: number
  denouncementsMade: number
  denouncementsReceived: number
  tribunalsWon: number
  tribunalsLost: number
  totalGulagTurns: number
  gulagEscapes: number
  moneyEarned: number
  moneySpent: number
  propertiesOwned: number
  maxWealth: number
  testsPassed: number
  testsFailed: number
}

// Game statistics
export interface GameStatistics {
  gameStartTime: Date
  gameEndTime?: Date
  totalTurns: number
  playerStats: Record<string, PlayerStatistics>
  totalDenouncements: number
  totalTribunals: number
  totalGulagSentences: number
  stateTreasuryPeak: number
}

// Unanimous end vote
export interface EndVote {
  voterId: string
  vote: boolean
  timestamp: Date
}

// Rehabilitation Confession
export interface Confession {
  id: string
  prisonerId: string
  confession: string
  timestamp: Date
  reviewed: boolean
  accepted?: boolean
}

// Game state
export interface GameState {
  // Game flow
  gamePhase: GamePhase

  // Players
  players: Player[]
  stalinPlayerId: string | null
  currentPlayerIndex: number

  // Board
  properties: Property[]

  // Treasury
  stateTreasury: number

  // Turn management
  turnPhase: TurnPhase
  doublesCount: number
  hasRolled: boolean
  roundNumber: number // Track rounds for voucher expiration and debt

  // Dice
  dice: [number, number]
  isRolling: boolean

  // Game log
  gameLog: LogEntry[]

  // Pending actions
  pendingAction: PendingAction | null

  // Gulag system
  activeVouchers: VoucherAgreement[]
  pendingBribes: BribeRequest[]

  // Trade system
  activeTradeOffers: TradeOffer[]

  // Card decks
  partyDirectiveDeck: string[] // Card IDs (shuffled)
  partyDirectiveDiscard: string[] // Used cards
  communistTestUsedQuestions: Set<string> // Question IDs already used

  // Game end tracking
  gameEndCondition: GameEndCondition | null
  winnerId: string | null
  showEndScreen: boolean

  // Statistics
  gameStatistics: GameStatistics

  // Unanimous end vote
  endVoteInProgress: boolean
  endVoteInitiator: string | null
  endVotes: Record<string, boolean> // playerId -> vote

  // Rehabilitation confessions
  confessions: Confession[]
}
