export type SpaceType = 'property' | 'railway' | 'utility' | 'tax' | 'card' | 'corner';

export type PropertyGroup =
  | 'siberian'      // Brown - Siberian Work Camps
  | 'collective'    // Light Blue - Collective Farms
  | 'industrial'    // Pink - Industrial Centers
  | 'ministry'      // Orange - Government Ministries
  | 'military'      // Red - Military Installations
  | 'media'         // Yellow - State Media
  | 'elite'         // Green - Party Elite District
  | 'kremlin'       // Dark Blue - Kremlin Complex
  | 'railroad'      // Railways
  | 'utility';      // Utilities

export type CardType = 'party-directive' | 'communist-test';

export interface BoardSpace {
  id: number;
  name: string;
  russianName?: string;
  type: SpaceType;
  group?: PropertyGroup;
  baseQuota?: number;
  baseCost?: number;
  cardType?: CardType;
  specialRule?: string;
}

export interface PropertySpace extends BoardSpace {
  type: 'property';
  group: PropertyGroup;
  baseQuota: number;
  baseCost: number;
}

export interface RailwaySpace extends BoardSpace {
  type: 'railway';
  group: 'railroad';
}

export interface UtilitySpace extends BoardSpace {
  type: 'utility';
  group: 'utility';
}

export interface TaxSpace extends BoardSpace {
  type: 'tax';
  amount: number;
}

export interface CardSpace extends BoardSpace {
  type: 'card';
  cardType: CardType;
}

export interface CornerSpace extends BoardSpace {
  type: 'corner';
  cornerType: 'stoy' | 'gulag' | 'breadline' | 'enemy-of-state';
}

// Player-related types
export type PartyRank = 'proletariat' | 'partyMember' | 'commissar' | 'innerCircle';

export type PieceType = 'hammer' | 'sickle' | 'redStar' | 'tank' | 'breadLoaf' | 'ironCurtain' | 'vodkaBottle' | 'statueOfLenin';

export interface Player {
  id: string;
  name: string;
  piece: PieceType | null;  // null for Stalin
  rank: PartyRank;
  rubles: number;
  position: number;
  properties: string[];     // property IDs
  inGulag: boolean;
  gulagTurns: number;
  isEliminated: boolean;
  isStalin: boolean;

  // Tracking for rank progression
  correctTestAnswers: number;
  consecutiveFailedTests: number;
  underSuspicion: boolean;
}

export interface Property {
  spaceId: number;
  custodianId: string | null;
  collectivizationLevel: number; // 0-5
}

// Game phases
export type GamePhase = 'welcome' | 'setup' | 'playing' | 'ended';
export type TurnPhase = 'pre-roll' | 'rolling' | 'moving' | 'resolving' | 'post-turn';

// Game state
export interface GameState {
  // Game flow
  gamePhase: GamePhase;

  // Players
  players: Player[];
  stalinPlayerId: string | null;
  currentPlayerIndex: number;

  // Board
  properties: Property[];

  // Treasury
  stateTreasury: number;

  // Turn management
  turnPhase: TurnPhase;
  doublesCount: number;
}
