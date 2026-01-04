// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { Player } from '../../types/game'
import { PIECE_ABILITIES } from '../../data/pieceAbilities'
import { getAbilityStatusText } from '../../utils/pieceAbilityUtils'
import './PieceAbilityIndicator.css'

interface PieceAbilityIndicatorProps {
  player: Player
}

export function PieceAbilityIndicator ({ player }: PieceAbilityIndicatorProps) {
  if (!player.piece) return null

  const abilityData = PIECE_ABILITIES[player.piece]
  const statusText = getAbilityStatusText(player)

  // Determine ability availability class
  const getAbilityClass = () => {
    const baseClass = 'piece-ability-indicator'

    // Check if any one-time ability is still available
    const hasAvailable =
      (player.piece === 'sickle' && !player.hasUsedSickleHarvest) ||
      (player.piece === 'ironCurtain' && !player.hasUsedIronCurtainDisappear) ||
      (player.piece === 'statueOfLenin' && !player.hasUsedLeninSpeech) ||
      (player.piece === 'tank' && !player.hasUsedTankGulagImmunity)

    return `${baseClass} ${hasAvailable ? 'ability-available' : 'ability-passive'}`
  }

  return (
    <div className={getAbilityClass()}>
      <div className='ability-header'>
        <span className='ability-emoji'>{abilityData.emoji}</span>
        <span className='ability-name'>{abilityData.name}</span>
      </div>

      <div className='ability-status'>
        <small>{statusText}</small>
      </div>

      {/* Show special warnings/reminders */}
      {player.piece === 'sickle' && (
        <div className='ability-reminder'>
          ⚠️ Say &quot;For the Motherland!&quot; before rolling
        </div>
      )}

      {player.piece === 'breadLoaf' && player.rubles < 100 && (
        <div className='ability-warning'>
          🍞 STARVING: Must beg this turn!
        </div>
      )}

      {player.piece === 'breadLoaf' && player.rubles >= 1000 && (
        <div className='ability-warning'>
          🍞 At wealth cap (1000₽)
        </div>
      )}

      {player.piece === 'redStar' && player.rank === 'partyMember' && (
        <div className='ability-warning'>
          ⭐ WARNING: Demotion = Execution
        </div>
      )}

      {player.piece === 'vodkaBottle' && player.vodkaUseCount > 4 && (
        <div className='ability-reminder'>
          🍾 Very drunk! ({player.vodkaUseCount} drinks)
        </div>
      )}

      {player.piece === 'statueOfLenin' && (
        <div className='ability-reminder'>
          🗿 Stand when Lenin mentioned
        </div>
      )}

      {player.piece === 'hammer' && (
        <div className='ability-info'>
          🔨 Must vote &quot;guilty&quot; in tribunals
        </div>
      )}
    </div>
  )
}
