// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useEffect, useState } from 'react'
import styles from './Dice.module.css'

interface DiceProps {
  die1: number
  die2: number
  isRolling: boolean
  isDoubles: boolean
  onRollComplete?: () => void
}

const Dice = ({ die1, die2, isRolling, isDoubles, onRollComplete }: DiceProps) => {
  const [animatedDie1, setAnimatedDie1] = useState(die1)
  const [animatedDie2, setAnimatedDie2] = useState(die2)

  useEffect(() => {
    if (isRolling) {
      // Animate with random values during roll
      const interval = setInterval(() => {
        setAnimatedDie1(Math.floor(Math.random() * 6) + 1)
        setAnimatedDie2(Math.floor(Math.random() * 6) + 1)
      }, 100)

      // Stop animation after 1.5 seconds and show final values
      const timeout = setTimeout(() => {
        clearInterval(interval)
        setAnimatedDie1(die1)
        setAnimatedDie2(die2)
        onRollComplete?.()
      }, 1500)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    } else {
      setAnimatedDie1(die1)
      setAnimatedDie2(die2)
    }
  }, [isRolling, die1, die2, onRollComplete])

  const getDieFace = (value: number) => {
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    return faces[value - 1] || '⚀'
  }

  return (
    <div className={styles.diceContainer}>
      <div className={`${styles.diceWrapper} ${isDoubles ? styles.doubles : ''}`}>
        <div className={`${styles.die} ${isRolling ? styles.rolling : ''}`}>
          <div className={styles.dieFace}>{getDieFace(animatedDie1)}</div>
        </div>
        <div className={`${styles.die} ${isRolling ? styles.rolling : ''}`}>
          <div className={styles.dieFace}>{getDieFace(animatedDie2)}</div>
        </div>
      </div>
      <div className={styles.total}>
        Total: {animatedDie1 + animatedDie2}
      </div>
      {isDoubles && !isRolling && (
        <div className={styles.doublesIndicator}>
          DOUBLES!
        </div>
      )}
    </div>
  )
}

export default Dice
