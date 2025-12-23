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

  // Tracking for rank progression
  correctTestAnswers: number
  consecutiveFailedTests: number
  underSuspicion: boolean

  // Property system
  skipNextTurn: boolean // For Industrial Centers conscripted labour
  usedRailwayGulagPower: boolean // All four railways special power

  // Gulag system
  vouchingFor: string | null // Player ID they vouched for
  vouchedByRound: number | null // Round number when vouch expires

  // Debt system
  debt: Debt | null
  debtCreatedAtRound: number | null
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
  | 'draw-card'
  | 'collective-farm-announcement'
  | 'gulag-escape-choice'
  | 'voucher-request'
  | 'inform-on-player'
  | 'bribe-stalin'
  | 'liquidation-required'

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

// Bribe request
export interface BribeRequest {
  id: string
  playerId: string
  amount: number
  reason: string // For gulag escape, property influence, etc.
  timestamp: Date
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
}
