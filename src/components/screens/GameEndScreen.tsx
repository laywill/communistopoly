// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../../store/gameStore'
import './GameEndScreen.css'

export default function GameEndScreen () {
  const gameEndCondition = useGameStore((state) => state.gameEndCondition)
  const winnerId = useGameStore((state) => state.winnerId)
  const players = useGameStore((state) => state.players)
  const gameStatistics = useGameStore((state) => state.gameStatistics)
  const startNewGame = useGameStore((state) => state.startNewGame)
  const resetGame = useGameStore((state) => state.resetGame)

  const winner = players.find(p => p.id === winnerId)
  const eliminatedPlayers = players.filter(p => p.isEliminated && !p.isStalin)

  const formatRank = (rank: string): string => {
    return rank.charAt(0).toUpperCase() + rank.slice(1).replace(/([A-Z])/g, ' $1')
  }

  const formatDuration = (): string => {
    if (gameStatistics.gameEndTime == null) return 'Unknown'
    const duration = gameStatistics.gameEndTime.getTime() - gameStatistics.gameStartTime.getTime()
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${String(hours)}h ${String(minutes)}m`
  }

  const handleNewGame = () => {
    startNewGame()
  }

  const handleMainMenu = () => {
    resetGame()
  }

  if (gameEndCondition === 'survivor' && (winner != null)) {
    return (
      <div className='game-end-screen'>
        <div className='game-end-content survivor-victory'>
          <div className='end-header'>
            <div className='soviet-symbols'>☭ ★ ☭ ★ ☭ ★ ☭</div>
            <h1 className='end-title'>SURVIVOR</h1>
            <div className='soviet-symbols'>☭ ★ ☭ ★ ☭ ★ ☭</div>
          </div>

          <div className='winner-display'>
            <div className='winner-piece'>
              {winner.piece && <span className='piece-emoji'>{winner.piece}</span>}
            </div>
            <h2 className='winner-name'>COMRADE {winner.name.toUpperCase()}</h2>
            <p className='winner-subtitle'>Has outlasted all other comrades.</p>
          </div>

          <div className='winner-quote'>
            &quot;In the Soviet Union, survival is victory enough.&quot;
          </div>

          <div className='winner-stats'>
            <h3>Final Statistics</h3>
            <div className='stat-grid'>
              <div className='stat-item'>
                <span className='stat-label'>Turns Survived:</span>
                <span className='stat-value'>{gameStatistics.totalTurns}</span>
              </div>
              <div className='stat-item'>
                <span className='stat-label'>Final Rank:</span>
                <span className='stat-value'>{formatRank(winner.rank)}</span>
              </div>
              <div className='stat-item'>
                <span className='stat-label'>Final Wealth:</span>
                <span className='stat-value'>₽{winner.rubles}</span>
              </div>
              <div className='stat-item'>
                <span className='stat-label'>Properties Controlled:</span>
                <span className='stat-value'>{winner.properties.length}</span>
              </div>
              <div className='stat-item'>
                <span className='stat-label'>Time in Gulag:</span>
                <span className='stat-value'>{gameStatistics.playerStats[winner.id].totalGulagTurns} turns</span>
              </div>
              <div className='stat-item'>
                <span className='stat-label'>Tests Passed:</span>
                <span className='stat-value'>{gameStatistics.playerStats[winner.id].testsPassed}</span>
              </div>
            </div>
          </div>

          <div className='all-players-stats'>
            <h3>All Comrades</h3>
            <div className='players-table'>
              {players.filter(p => !p.isStalin).map(p => (
                <div key={p.id} className={`player-row ${p.isEliminated ? 'eliminated' : 'survivor'}`}>
                  <div className='player-info'>
                    <span className='player-piece'>{p.piece}</span>
                    <span className='player-name'>{p.name}</span>
                  </div>
                  <div className='player-final-stats'>
                    <span className='player-rank'>{formatRank(p.finalRank ?? p.rank)}</span>
                    <span className='player-wealth'>₽{p.finalWealth ?? p.rubles}</span>
                    {p.isEliminated && (
                      <span className='elimination-reason'>
                        ({p.eliminationReason?.replace(/([A-Z])/g, ' $1').trim()})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='game-summary'>
            <h3>Game Summary</h3>
            <div className='summary-stats'>
              <div className='summary-item'>
                <span>Game Duration:</span>
                <span>{formatDuration()}</span>
              </div>
              <div className='summary-item'>
                <span>Total Rounds:</span>
                <span>{gameStatistics.totalTurns}</span>
              </div>
              <div className='summary-item'>
                <span>Total Gulag Sentences:</span>
                <span>{gameStatistics.totalGulagSentences}</span>
              </div>
              <div className='summary-item'>
                <span>Peak State Treasury:</span>
                <span>₽{gameStatistics.stateTreasuryPeak}</span>
              </div>
            </div>
          </div>

          <div className='end-actions'>
            <button className='new-game-button' onClick={handleNewGame}>
              NEW GAME
            </button>
            <button className='main-menu-button' onClick={handleMainMenu}>
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameEndCondition === 'stalinWins') {
    return (
      <div className='game-end-screen'>
        <div className='game-end-content stalin-victory'>
          <div className='end-header'>
            <h1 className='end-title stalin-title'>THE STATE WINS</h1>
          </div>

          <div className='stalin-message'>
            <p>All comrades have been eliminated.</p>
            <p>The Party is eternal.</p>
            <p className='stalin-glory'>Long live Stalin.</p>
          </div>

          <div className='stalin-portrait'>
            <div className='portrait-frame'>☭</div>
          </div>

          <div className='casualty-list'>
            <h3>Fallen Comrades</h3>
            <div className='casualties-table'>
              {eliminatedPlayers.map(p => (
                <div key={p.id} className='casualty-row'>
                  <span className='casualty-piece'>{p.piece}</span>
                  <span className='casualty-name'>{p.name}</span>
                  <span className='casualty-cause'>
                    {p.eliminationReason?.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className='casualty-turn'>Round {p.eliminationTurn}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='game-summary'>
            <h3>Game Summary</h3>
            <div className='summary-stats'>
              <div className='summary-item'>
                <span>Game Duration:</span>
                <span>{formatDuration()}</span>
              </div>
              <div className='summary-item'>
                <span>Total Rounds:</span>
                <span>{gameStatistics.totalTurns}</span>
              </div>
              <div className='summary-item'>
                <span>Total Gulag Sentences:</span>
                <span>{gameStatistics.totalGulagSentences}</span>
              </div>
              <div className='summary-item'>
                <span>Total Eliminated:</span>
                <span>{eliminatedPlayers.length}</span>
              </div>
            </div>
          </div>

          <div className='end-actions'>
            <button className='new-game-button' onClick={handleNewGame}>
              NEW GAME
            </button>
            <button className='main-menu-button' onClick={handleMainMenu}>
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameEndCondition === 'unanimous') {
    return (
      <div className='game-end-screen'>
        <div className='game-end-content unanimous-end'>
          <div className='end-header'>
            <h1 className='end-title'>UNANIMOUS DECISION</h1>
          </div>

          <div className='unanimous-message'>
            <p>The comrades have unanimously voted to end the game.</p>
            <p>Democratic centralism prevails!</p>
          </div>

          <div className='final-standings'>
            <h3>Final Standings</h3>
            <div className='standings-table'>
              {players
                .filter(p => !p.isStalin)
                .sort((a, b) => (b.rubles || 0) - (a.rubles || 0))
                .map((p, index) => (
                  <div key={p.id} className='standing-row'>
                    <span className='standing-rank'>#{index + 1}</span>
                    <span className='standing-piece'>{p.piece}</span>
                    <span className='standing-name'>{p.name}</span>
                    <span className='standing-wealth'>₽{p.rubles}</span>
                    <span className='standing-properties'>{p.properties.length} properties</span>
                  </div>
                ))}
            </div>
          </div>

          <div className='game-summary'>
            <h3>Game Summary</h3>
            <div className='summary-stats'>
              <div className='summary-item'>
                <span>Game Duration:</span>
                <span>{formatDuration()}</span>
              </div>
              <div className='summary-item'>
                <span>Total Rounds:</span>
                <span>{gameStatistics.totalTurns}</span>
              </div>
              <div className='summary-item'>
                <span>Total Gulag Sentences:</span>
                <span>{gameStatistics.totalGulagSentences}</span>
              </div>
            </div>
          </div>

          <div className='end-actions'>
            <button className='new-game-button' onClick={handleNewGame}>
              NEW GAME
            </button>
            <button className='main-menu-button' onClick={handleMainMenu}>
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
