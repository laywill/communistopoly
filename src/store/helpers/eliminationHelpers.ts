// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { EliminationReason } from '../../types/game'

export function getEliminationMessage (playerName: string, reason: EliminationReason): string {
  const messages: Record<EliminationReason, string> = {
    bankruptcy: `${playerName} has been eliminated due to bankruptcy. They have been declared an Enemy of the People.`,
    execution: `${playerName} has been executed by order of Stalin. They are now a Ghost of the Revolution.`,
    gulagTimeout: `${playerName} died in the Gulag after 10 turns. They are now a Ghost of the Revolution.`,
    redStarDemotion: `${playerName}'s Red Star has fallen to Proletariat - immediate execution! They are now a Ghost of the Revolution.`,
    unanimous: `${playerName} was unanimously voted out by all players. They are now a Ghost of the Revolution.`
  }
  return messages[reason]
}
