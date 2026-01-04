// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { Player, Property, GulagReason } from '../../types/game'
import { useGameStore } from '../../store/gameStore'

export function createTestPlayer (overrides: Partial<Player> = {}): Player {
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
    hasUsedTankGulagImmunity: false,
    vouchingFor: null,
    vouchedByRound: null,
    debt: null,
    ...overrides
  }
}

export function createTestProperty (spaceId: number, overrides: Partial<Property> = {}): Property {
  return {
    spaceId,
    custodianId: null,
    collectivizationLevel: 0,
    mortgaged: false,
    ...overrides
  }
}

/**
 * Helper to get the required doubles for Gulag escape based on turn number
 */
export function getRequiredDoublesForEscape (gulagTurns: number): number[] {
  switch (gulagTurns) {
    case 1:
      return [6] // Only double 6s
    case 2:
      return [5, 6] // Double 5s or 6s
    case 3:
      return [4, 5, 6] // Double 4s, 5s, or 6s
    case 4:
      return [3, 4, 5, 6] // Double 3s, 4s, 5s, or 6s
    default:
      return [1, 2, 3, 4, 5, 6] // Any doubles
  }
}

/**
 * Helper to send a player to Gulag with a test justification
 */
export function sendPlayerToGulag (playerId: string, reason: GulagReason) {
  const { sendToGulag } = useGameStore.getState()
  sendToGulag(playerId, reason, 'Test justification')
}

/**
 * Helper to set the number of turns a player has spent in Gulag
 */
export function setGulagTurns (playerId: string, turns: number) {
  useGameStore.setState((state) => ({
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, gulagTurns: turns } : p
    )
  }))
}
