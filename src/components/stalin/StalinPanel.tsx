// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './StalinPanel.css';

export default function StalinPanel() {
  const players = useGameStore((state) => state.players);
  const sendToGulag = useGameStore((state) => state.sendToGulag);
  const respondToBribe = useGameStore((state) => state.respondToBribe);
  const pendingBribes = useGameStore((state) => state.pendingBribes);
  const stateTreasury = useGameStore((state) => state.stateTreasury);
  const roundNumber = useGameStore((state) => state.currentRound);
  const promotePlayer = useGameStore((state) => state.promotePlayer);
  const demotePlayer = useGameStore((state) => state.demotePlayer);
  const initiateGreatPurge = useGameStore((state) => state.initiateGreatPurge);
  const initiateFiveYearPlan = useGameStore((state) => state.initiateFiveYearPlan);
  const grantHeroOfSovietUnion = useGameStore((state) => state.greatHeroOfSovietUnion);
  const greatPurgeUsed = useGameStore((state) => state.greatPurgeUsed);
  const activeFiveYearPlan = useGameStore((state) => state.activeFiveYearPlan);

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [demotePlayerId, setDemotePlayerId] = useState<string>('');
  const [demoteJustification, setDemoteJustification] = useState('');
  const [promotePlayerId, setPromotePlayerId] = useState<string>('');
  const [auditPlayerId, setAuditPlayerId] = useState<string>('');
  const [showAuditResults, setShowAuditResults] = useState(false);
  const [heroPlayerId, setHeroPlayerId] = useState<string>('');
  const [fiveYearTarget, setFiveYearTarget] = useState('1000');
  const [fiveYearDuration, setFiveYearDuration] = useState('10');

  // Get Gulag inmates
  const gulagInmates = players.filter((p) => !p.isStalin && p.inGulag);

  // Get non-Stalin, non-Gulag, non-eliminated players
  const availablePlayers = players.filter(
    (p) => !p.isStalin && !p.inGulag && !p.isEliminated
  );

  const handleSendToGulag = () => {
    if (selectedPlayer && justification.trim()) {
      sendToGulag(selectedPlayer, 'stalinDecree', justification);
      setSelectedPlayer('');
      setJustification('');
    }
  };

  const handleBribeResponse = (bribeId: string, accepted: boolean) => {
    respondToBribe(bribeId, accepted);
  };

  const handlePromote = () => {
    if (promotePlayerId) {
      promotePlayer(promotePlayerId);
      setPromotePlayerId('');
    }
  };

  const handleDemote = () => {
    if (demotePlayerId && demoteJustification.trim()) {
      demotePlayer(demotePlayerId);
      // Log the justification
      setDemotePlayerId('');
      setDemoteJustification('');
    }
  };

  const handleAudit = () => {
    if (auditPlayerId) {
      setShowAuditResults(true);
    }
  };

  const handleGrantHero = () => {
    if (heroPlayerId) {
      grantHeroOfSovietUnion(heroPlayerId);
      setHeroPlayerId('');
    }
  };

  const handleInitiateFiveYearPlan = () => {
    const target = parseInt(fiveYearTarget);
    const duration = parseInt(fiveYearDuration);
    if (!isNaN(target) && !isNaN(duration) && target > 0 && duration > 0) {
      const deadline = new Date(Date.now() + duration * 60 * 60 * 1000); // Convert hours to milliseconds
      initiateFiveYearPlan(target, deadline);
    }
  };

  const getRankName = (rank: string) => {
    const rankNames: Record<string, string> = {
      proletariat: 'Proletariat',
      partyMember: 'Party Member',
      commissar: 'Commissar',
      innerCircle: 'Inner Circle',
    };
    return rankNames[rank] || rank;
  };

  const getNextRank = (playerId: string): string => {
    const player = players.find(p => p.id === playerId);
    if (!player) return '';

    const rankOrder = ['proletariat', 'partyMember', 'commissar', 'innerCircle'];
    const currentIndex = rankOrder.indexOf(player.rank);
    if (currentIndex < rankOrder.length - 1) {
      return getRankName(rankOrder[currentIndex + 1]);
    }
    return 'MAX RANK';
  };

  return (
    <div className="stalin-panel">
      <div className="stalin-header">
        <span className="stalin-icon">☭</span>
        <h2>STALIN&apos;S CONTROL PANEL</h2>
      </div>

      <div className="stalin-content">
        {/* Treasury and Round Info */}
        <div className="stalin-section">
          <div className="stalin-stat">
            <label>STATE TREASURY:</label>
            <span className="treasury-value">₽{stateTreasury}</span>
          </div>
          <div className="stalin-stat">
            <label>ROUND:</label>
            <span className="round-value">{roundNumber}</span>
          </div>
        </div>

        {/* Gulag Population */}
        <div className="stalin-section">
          <h3>⛓️ GULAG POPULATION</h3>
          {gulagInmates.length === 0 ? (
            <p className="empty-message">No inmates currently</p>
          ) : (
            <div className="inmates-list">
              {gulagInmates.map((inmate) => (
                <div key={inmate.id} className="inmate-card">
                  <div className="inmate-info">
                    <span className="inmate-name">{inmate.name}</span>
                    <span className="inmate-sentence">Day {inmate.gulagTurns + 1}</span>
                  </div>
                  <div className="inmate-details">
                    <span className="inmate-rubles">₽{inmate.rubles}</span>
                    <span className="inmate-rank">{inmate.rank}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Bribes */}
        <div className="stalin-section">
          <h3>💸 PENDING BRIBES</h3>
          {pendingBribes.length === 0 ? (
            <p className="empty-message">No pending bribes</p>
          ) : (
            <div className="bribes-list">
              {pendingBribes.map((bribe) => {
                const player = players.find((p) => p.id === bribe.playerId);
                return (
                  <div key={bribe.id} className="bribe-card">
                    <div className="bribe-info">
                      <span className="bribe-player">{player?.name}</span>
                      <span className="bribe-amount">₽{bribe.amount}</span>
                    </div>
                    <div className="bribe-reason">{bribe.reason}</div>
                    <div className="bribe-actions">
                      <button
                        className="bribe-button accept"
                        onClick={() => { handleBribeResponse(bribe.id, true); }}
                      >
                        ✓ ACCEPT
                      </button>
                      <button
                        className="bribe-button reject"
                        onClick={() => { handleBribeResponse(bribe.id, false); }}
                      >
                        ✗ REJECT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Send to Gulag */}
        <div className="stalin-section">
          <h3>⚡ SEND TO GULAG</h3>
          <div className="send-gulag-form">
            <select
              className="player-select"
              value={selectedPlayer}
              onChange={(e) => { setSelectedPlayer(e.target.value); }}
            >
              <option value="">Select a player...</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} - {player.rank} - ₽{player.rubles}
                </option>
              ))}
            </select>

            <textarea
              className="justification-input"
              placeholder="Justification (required)"
              value={justification}
              onChange={(e) => { setJustification(e.target.value); }}
              rows={3}
            />

            <button
              className="send-gulag-button"
              onClick={handleSendToGulag}
              disabled={!selectedPlayer || !justification.trim()}
            >
              SEND TO GULAG
            </button>
          </div>
        </div>

        {/* Rank Management */}
        <div className="stalin-section">
          <h3>⭐ RANK MANAGEMENT</h3>

          {/* Promote Player */}
          <div className="rank-control" style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Promote Player:</h4>
            <select
              className="player-select"
              value={promotePlayerId}
              onChange={(e) => { setPromotePlayerId(e.target.value); }}
              style={{ marginBottom: '8px' }}
            >
              <option value="">Select a player...</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} - {getRankName(player.rank)}
                </option>
              ))}
            </select>
            <button
              className="stalin-button promote"
              onClick={handlePromote}
              disabled={!promotePlayerId}
              style={{ width: '100%', background: 'var(--color-military-olive)', color: 'white' }}
            >
              PROMOTE TO {promotePlayerId ? getNextRank(promotePlayerId) : '---'}
            </button>
          </div>

          {/* Demote Player */}
          <div className="rank-control">
            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Demote Player:</h4>
            <select
              className="player-select"
              value={demotePlayerId}
              onChange={(e) => { setDemotePlayerId(e.target.value); }}
              style={{ marginBottom: '8px' }}
            >
              <option value="">Select a player...</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} - {getRankName(player.rank)}
                </option>
              ))}
            </select>
            <textarea
              className="justification-input"
              placeholder="Justification (required for the record)"
              value={demoteJustification}
              onChange={(e) => { setDemoteJustification(e.target.value); }}
              rows={2}
              style={{ marginBottom: '8px' }}
            />
            <button
              className="stalin-button demote"
              onClick={handleDemote}
              disabled={!demotePlayerId || !demoteJustification.trim()}
              style={{ width: '100%', background: 'var(--color-blood-burgundy)', color: 'white' }}
            >
              DEMOTE
            </button>
          </div>
        </div>

        {/* Special Decrees */}
        <div className="stalin-section">
          <h3>☭ SPECIAL DECREES</h3>

          {/* Great Purge */}
          <div style={{ marginBottom: '16px' }}>
            <button
              className="stalin-button"
              onClick={initiateGreatPurge}
              disabled={greatPurgeUsed}
              style={{
                width: '100%',
                background: greatPurgeUsed ? '#666' : 'var(--color-blood-burgundy)',
                color: 'white',
                padding: '12px'
              }}
            >
              {greatPurgeUsed ? '✓ GREAT PURGE USED' : '☭ THE GREAT PURGE'}
            </button>
            <p style={{ fontSize: '11px', color: 'var(--color-gulag-grey)', margin: '4px 0 0 0' }}>
              Once per game: All players vote simultaneously
            </p>
          </div>

          {/* Five-Year Plan */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Five-Year Plan:</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="number"
                placeholder="Target ₽"
                value={fiveYearTarget}
                onChange={(e) => { setFiveYearTarget(e.target.value); }}
                style={{ flex: 1, padding: '8px' }}
              />
              <input
                type="number"
                placeholder="Minutes"
                value={fiveYearDuration}
                onChange={(e) => { setFiveYearDuration(e.target.value); }}
                style={{ flex: 1, padding: '8px' }}
              />
            </div>
            <button
              className="stalin-button"
              onClick={handleInitiateFiveYearPlan}
              disabled={!!activeFiveYearPlan}
              style={{
                width: '100%',
                background: activeFiveYearPlan ? '#666' : 'var(--color-soviet-red)',
                color: 'white'
              }}
            >
              {activeFiveYearPlan ? 'PLAN IN PROGRESS' : 'INITIATE PLAN'}
            </button>
          </div>

          {/* Hero of Soviet Union */}
          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Hero of Soviet Union:</h4>
            <select
              className="player-select"
              value={heroPlayerId}
              onChange={(e) => { setHeroPlayerId(e.target.value); }}
              style={{ marginBottom: '8px' }}
            >
              <option value="">Select a player...</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
            <button
              className="stalin-button"
              onClick={handleGrantHero}
              disabled={!heroPlayerId}
              style={{ width: '100%', background: 'var(--color-gold)', color: 'var(--color-propaganda-black)' }}
            >
              ⭐ GRANT HERO STATUS
            </button>
            <p style={{ fontSize: '11px', color: 'var(--color-gulag-grey)', margin: '4px 0 0 0' }}>
              Immune to all negative effects for 3 rounds
            </p>
          </div>
        </div>

        {/* Audit System */}
        <div className="stalin-section">
          <h3>🔍 AUDIT SYSTEM</h3>
          <select
            className="player-select"
            value={auditPlayerId}
            onChange={(e) => {
              setAuditPlayerId(e.target.value);
              setShowAuditResults(false);
            }}
            style={{ marginBottom: '8px' }}
          >
            <option value="">Select a player to audit...</option>
            {availablePlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <button
            className="stalin-button"
            onClick={handleAudit}
            disabled={!auditPlayerId}
            style={{ width: '100%', marginBottom: '12px' }}
          >
            CONDUCT AUDIT
          </button>

          {showAuditResults && auditPlayerId && (() => {
            const player = players.find(p => p.id === auditPlayerId);
            if (!player) return null;

            return (
              <div
                style={{
                  background: 'var(--color-parchment)',
                  border: '2px solid var(--color-propaganda-black)',
                  padding: '12px',
                  borderRadius: '4px'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                  AUDIT REPORT: {player.name}
                </h4>
                <div style={{ fontSize: '13px' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Rank:</strong> {getRankName(player.rank)}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Rubles:</strong> ₽{player.rubles}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Properties:</strong> {player.properties.length}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>In Gulag:</strong> {player.inGulag ? `Yes (Day ${String(player.gulagTurns + 1)})` : 'No'}
                  </div>
                  {player.piece === 'ironCurtain' && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'var(--color-warning-amber)', borderRadius: '4px' }}>
                      <strong>⚠️ IRON CURTAIN PIECE:</strong><br />
                      Claimed Rubles: ₽{player.ironCurtainClaimedRubles}<br />
                      Actual Rubles: ₽{player.rubles}
                      {player.ironCurtainClaimedRubles !== player.rubles && (
                        <div style={{ color: 'var(--color-blood-burgundy)', fontWeight: 'bold', marginTop: '4px' }}>
                          DISCREPANCY DETECTED!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
