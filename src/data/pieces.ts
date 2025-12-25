import { PieceType } from '../types/game'

export interface PieceData {
  type: PieceType
  name: string
  icon: string
  description: string
  shortAbility: string
  fullAbility: string
}

export const PIECES: PieceData[] = [
  {
    type: 'hammer',
    name: 'The Hammer',
    icon: '🔨',
    description: "The worker's tool, building the future",
    shortAbility: '+50₽ at Stoy, player-Gulag immunity',
    fullAbility: '+50₽ every time you pass Stoy. Cannot be sent to Gulag by other players (only by Stalin or landing on Enemy of the State). Must always vote "guilty" in tribunals or lose ability for rest of game.'
  },
  {
    type: 'sickle',
    name: 'The Sickle',
    icon: '🌾',
    description: "The farmer's blade, reaping the harvest",
    shortAbility: 'Half farm quotas, harvest ability',
    fullAbility: 'Collective Farm quotas against you are halved. Once per game, may "harvest" another player\'s property (steal custodianship of one property worth less than ₽150). Must announce "For the Motherland!" before each roll or pay ₽25 fine.'
  },
  {
    type: 'redStar',
    name: 'The Red Star',
    icon: '⭐',
    description: 'Shining beacon of the revolution',
    shortAbility: 'Start as Party Member, higher risk',
    fullAbility: 'Start at Party Member rank instead of Proletariat. All Communist Test penalties against you are doubled. If you ever fall to Proletariat rank, you are immediately executed (eliminated from game).'
  },
  {
    type: 'tank',
    name: 'The Tank',
    icon: '🚛',
    description: 'The iron fist of the Red Army',
    shortAbility: 'Requisition 50₽, first Gulag immunity',
    fullAbility: 'May "requisition" ₽50 from any player you pass (once per lap around the board). Immune to first Gulag sentence (return to nearest Railway Station instead). Cannot control any properties in the Collective Farm group.'
  },
  {
    type: 'breadLoaf',
    name: 'The Bread Loaf',
    icon: '🍞',
    description: "The people's sustenance... when available",
    shortAbility: 'Pay debts for others, wealth cap',
    fullAbility: 'Whenever another player cannot pay a debt, you may pay it for them (they now owe YOU, not the state—interest accrues at 20% per round). If you ever have less than ₽100, you are "starving" and must beg other players or Stalin each turn. May never have more than ₽1,000 (excess must be "donated" to the State).'
  },
  {
    type: 'ironCurtain',
    name: 'The Iron Curtain',
    icon: '🚧',
    description: 'What happens in the USSR stays in the USSR',
    shortAbility: 'Hidden money, disappear properties',
    fullAbility: 'Other players cannot see your money (keep it hidden). Stalin may audit you at any time; if you have more than you\'ve claimed, Gulag. Once per game, may "disappear" a player\'s property card (shuffle it back into State ownership).'
  },
  {
    type: 'vodkaBottle',
    name: 'The Vodka Bottle',
    icon: '🍾',
    description: 'The true opiate of the masses',
    shortAbility: 'Roll 3 dice, immune to tricks',
    fullAbility: 'Before any roll, may "drink" to roll 3 dice and choose 2. Every time you use this ability, your speech must be slightly more slurred. If Stalin judges you "too sober," you must drink (in real life, water is acceptable) or lose the ability. Immune to trick questions (too drunk to be held accountable).'
  },
  {
    type: 'statueOfLenin',
    name: 'The Statue of Lenin',
    icon: '🗿',
    description: 'The eternal revolutionary, watching over us all',
    shortAbility: 'Rank protection, inspiring speech',
    fullAbility: 'Cannot be denounced by players of lower rank. Once per game, may give an "inspiring speech" (30 seconds) to gain ₽100 from each player who applauds (Stalin judges sincerity of applause). Must remain standing whenever Lenin is mentioned, or lose ₽50.'
  }
]

export function getPieceByType (type: PieceType): PieceData | undefined {
  return PIECES.find(piece => piece.type === type)
}

export function getAvailablePieces (usedPieces: Array<PieceType | null>): PieceData[] {
  return PIECES.filter(piece => !usedPieces.includes(piece.type))
}
