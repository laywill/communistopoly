// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { BoardSpace } from '../../types/game'
import styles from './CardSpace.module.css'

interface CardSpaceProps {
  space: BoardSpace
}

const CardSpace = ({ space }: CardSpaceProps): JSX.Element => {
  const isPartyDirective = space.cardType === 'party-directive'

  return (
    <div className={`${styles.card} ${isPartyDirective ? styles.partyDirective : styles.communistTest}`}>
      <div className={styles.icon}>
        {isPartyDirective ? '☭' : '★'}
      </div>
      <div className={styles.name}>
        {isPartyDirective ? 'Party Directive' : 'Communist Test'}
      </div>
      <div className={styles.instruction}>
        {isPartyDirective ? 'Draw Card' : 'Answer Question'}
      </div>
    </div>
  )
}

export default CardSpace
