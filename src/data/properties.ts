// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { PropertyGroup } from '../types/game'

export interface PropertyGroupInfo {
  name: string
  color: string
  properties: number[] // Space IDs
}

export const PROPERTY_GROUPS: Record<PropertyGroup, PropertyGroupInfo> = {
  siberian: {
    name: 'Siberian Work Camps',
    color: '#8B6914',
    properties: [1, 3]
  },
  collective: {
    name: 'Collective Farms',
    color: '#87CEEB',
    properties: [6, 8, 9]
  },
  industrial: {
    name: 'Industrial Centers',
    color: '#DB7093',
    properties: [11, 13, 14]
  },
  ministry: {
    name: 'Government Ministries',
    color: '#E86D1F',
    properties: [16, 18, 19]
  },
  military: {
    name: 'Military Installations',
    color: '#C41E3A',
    properties: [21, 23, 24]
  },
  media: {
    name: 'State Media',
    color: '#F4D03F',
    properties: [26, 27, 29]
  },
  elite: {
    name: 'Party Elite District',
    color: '#228B22',
    properties: [31, 32, 34]
  },
  kremlin: {
    name: 'Kremlin Complex',
    color: '#1C3A5F',
    properties: [37, 39]
  },
  railroad: {
    name: 'Trans-Siberian Railway Stations',
    color: '#1A1A1A',
    properties: [5, 15, 25, 35]
  },
  utility: {
    name: 'Means of Production',
    color: '#F5E6C8',
    properties: [12, 28]
  }
}

// Collectivization levels and their effects
export const COLLECTIVIZATION_LEVELS = [
  { level: 0, name: 'None', multiplier: 1.0, cost: 0 },
  { level: 1, name: "Worker's Committee", multiplier: 3.0, cost: 100 },
  { level: 2, name: 'Party Oversight', multiplier: 9.0, cost: 100 },
  { level: 3, name: 'Full Collectivization', multiplier: 27.0, cost: 100 },
  { level: 4, name: 'Model Soviet', multiplier: 81.0, cost: 100 },
  { level: 5, name: "People's Palace", multiplier: 243.0, cost: 200 }
]

export function getCollectivizationMultiplier (level: number): number {
  return COLLECTIVIZATION_LEVELS[level]?.multiplier ?? 1.0
}

export function getCollectivizationName (level: number): string {
  return COLLECTIVIZATION_LEVELS[level]?.name ?? 'None'
}

export function getNextCollectivizationCost (level: number): number {
  if (level >= 5) return 0
  return COLLECTIVIZATION_LEVELS[level + 1]?.cost ?? 0
}
