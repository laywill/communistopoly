// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { Player, Property, PartyRank, PieceType } from '../../types/game'

export function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test-player-1',
    name: 'Test Player',
    piece: 'hammer',
    rank: 'proletariat',
    rubles: 1500,
    position: 0,
    properties: [],
    inGulag: false,
    gulagTurns: 0,
    isEliminated: false,
    isStalin: false,
    correctTestAnswers: 0,
    consecutiveFailedTests: 0,
    underSuspicion: false,
    skipNextTurn: false,
    usedRailwayGulagPower: false,
    hasUsedSiberianCampsGulag: false,
    hasUsedSickleHarvest: false,
    sickleMotherlandForgotten: false,
    hasUsedLeninSpeech: false,
    hasUsedIronCurtainDisappear: false,
    hasFreeFromGulagCard: false,
    vodkaUseCount: 0,
    ironCurtainClaimedRubles: 0,
    owesFavourTo: [],
    ...overrides
  }
}

export function createTestProperty(spaceId: number, overrides: Partial<Property> = {}): Property {
  return {
    spaceId,
    custodianId: null,
    collectivizationLevel: 0,
    mortgaged: false,
    ...overrides
  }
}
