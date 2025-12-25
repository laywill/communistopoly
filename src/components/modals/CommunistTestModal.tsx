import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { TestQuestion } from '../../data/communistTestQuestions'
import styles from './CommunistTestModal.module.css'

interface CommunistTestModalProps {
  question: TestQuestion
  testedPlayerId: string
  onClose: () => void
}

export function CommunistTestModal ({ question, testedPlayerId, onClose }: CommunistTestModalProps) {
  const players = useGameStore((state) => state.players)
  const stalinPlayerId = useGameStore((state) => state.stalinPlayerId)
  const answerCommunistTest = useGameStore((state) => state.answerCommunistTest)

  const [phase, setPhase] = useState<'question' | 'result'>('question')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const testedPlayer = players.find((p) => p.id === testedPlayerId)
  const stalin = players.find((p) => p.id === stalinPlayerId)
  const reader = stalin // Stalin is always the reader

  if (!testedPlayer) {
    return null
  }

  const handleMarkAnswer = (correct: boolean) => {
    setIsCorrect(correct)

    // For trick questions, show Stalin deciding
    if (question.difficulty === 'trick') {
      setPhase('result')
    } else {
      // Apply effects immediately
      answerCommunistTest(question, correct ? question.answer : 'wrong', stalinPlayerId ?? '')
      setPhase('result')
    }
  }

  const handleStalinDecision = (decision: 'reward' | 'punish' | 'neutral') => {
    // For trick questions, Stalin decides the outcome
    const fakeCorrect = decision === 'reward'
    answerCommunistTest(question, fakeCorrect ? question.answer : 'wrong', stalinPlayerId ?? '')
    setPhase('result')
  }

  const handleClose = () => {
    onClose()
  }

  // Question Phase - Stalin reads the question and answer
  if (phase === 'question') {
    return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
          <div className={styles.header}>
            <span className={styles.icon}>⭐</span>
            <h2 className={styles.title}>COMMUNIST TEST</h2>
            <span className={styles.icon}>⭐</span>
          </div>

          <div className={styles.content}>
            <div className={styles.questionSection}>
              <div className={styles.playerInfo}>
                <div className={styles.testedPlayer}>
                  <span className={styles.label}>Testing:</span>
                  <strong>{testedPlayer.name}</strong>
                </div>
                <div className={styles.readerPlayer}>
                  <span className={styles.label}>Reader:</span>
                  <strong>{reader?.name}</strong>
                </div>
              </div>

              <div className={styles.difficultyBadgeLarge}>
                {question.difficulty.toUpperCase()}
              </div>

              <div className={styles.question}>
                <h3 className={styles.questionLabel}>QUESTION:</h3>
                <p className={styles.questionText}>{question.question}</p>
              </div>

              <div className={styles.answer}>
                <h4 className={styles.answerLabel}>CORRECT ANSWER (Reader Only):</h4>
                <p className={styles.answerText}>{question.answer}</p>
                {question.acceptableAnswers && question.acceptableAnswers.length > 0 && (
                  <p className={styles.alternativeAnswers}>
                    Also accept: {question.acceptableAnswers.join(', ')}
                  </p>
                )}
              </div>

              <div className={styles.instructions}>
                <p><strong>{stalin?.name ?? 'Stalin'}</strong>, read the question aloud to <strong>{testedPlayer.name}</strong>.</p>
                <p><strong>{testedPlayer.name}</strong> will answer verbally.</p>
                <p><strong>{stalin?.name ?? 'Stalin'}</strong>, mark their answer below:</p>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.buttonCorrect}
                onClick={() => { handleMarkAnswer(true) }}
              >
                ✓ CORRECT
              </button>
              <button
                className={styles.buttonIncorrect}
                onClick={() => { handleMarkAnswer(false) }}
              >
                ✗ INCORRECT
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Result Phase - For trick questions, Stalin must decide before showing result
  if (question.difficulty === 'trick' && isCorrect === null) {
    return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
          <div className={styles.header}>
            <span className={styles.icon}>☭</span>
            <h2 className={styles.title}>STALIN&apos;S JUDGMENT</h2>
            <span className={styles.icon}>☭</span>
          </div>

          <div className={styles.content}>
            <div className={styles.trickResultSection}>
              <h3 className={styles.trickQuestion}>TRICK QUESTION</h3>
              <p className={styles.trickInstruction}>
                <strong>{stalin?.name ?? 'Stalin'}</strong>, you must judge{' '}
                <strong>{testedPlayer.name}</strong>&apos;s answer.
              </p>

              <div className={styles.trickDecision}>
                <p className={styles.questionRecap}>Question: <em>{question.question}</em></p>
                <p className={styles.answerRecap}>
                  {testedPlayer.name}&apos;s answer: <em>(spoken aloud)</em>
                </p>
              </div>

              <div className={styles.stalinDecisionButtons}>
                <button
                  className={styles.buttonReward}
                  onClick={() => { handleStalinDecision('reward') }}
                >
                  REWARD (+₽200)
                </button>
                <button
                  className={styles.buttonNeutral}
                  onClick={() => { handleStalinDecision('neutral') }}
                >
                  ACCEPTABLE (No change)
                </button>
                <button
                  className={styles.buttonPunish}
                  onClick={() => { handleStalinDecision('punish') }}
                >
                  PUNISH (-₽200)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show result (phase === 'result')
  const reward = testedPlayer.piece === 'redStar' ? question.reward * 2 : question.reward
  const penalty = testedPlayer.piece === 'redStar' ? question.penalty * 2 : question.penalty

  return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
          <div className={styles.header}>
            <span className={styles.icon}>⭐</span>
            <h2 className={styles.title}>TEST RESULT</h2>
            <span className={styles.icon}>⭐</span>
          </div>

          <div className={styles.content}>
            <div className={styles.resultSection}>
              <div className={isCorrect === true ? styles.resultCorrect : styles.resultIncorrect}>
                <h3 className={styles.resultTitle}>
                  {isCorrect === true ? '✓ CORRECT' : '✗ INCORRECT'}
                </h3>
              </div>

              <div className={styles.answerReveal}>
                <h4>Correct Answer:</h4>
                <p>{question.answer}</p>
              </div>

              {isCorrect === true && question.difficulty !== 'trick' && (
                <div className={styles.rewardDisplay}>
                  <p className={styles.rewardText}>
                    {testedPlayer.name} receives <strong className={styles.rubles}>₽{reward}</strong>
                  </p>
                  {question.grantsRankUp && (
                    <p className={styles.rankUpText}>🎖 Promoted to next rank!</p>
                  )}
                </div>
              )}

              {isCorrect === false && question.difficulty !== 'trick' && penalty > 0 && (
                <div className={styles.penaltyDisplay}>
                  <p className={styles.penaltyText}>
                    {testedPlayer.name} pays penalty <strong className={styles.rubles}>₽{penalty}</strong>
                  </p>
                  {testedPlayer.consecutiveFailedTests + 1 >= 2 && (
                    <p className={styles.demoteText}>⚠ Demoted one rank (2 consecutive failures)</p>
                  )}
                </div>
              )}

              {testedPlayer.piece === 'redStar' && (
                <div className={styles.redStarWarning}>
                  ⭐ Red Star: Double penalties applied
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button className={styles.buttonPrimary} onClick={handleClose}>
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      </div>
    )
}
