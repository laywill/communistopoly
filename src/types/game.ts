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
