// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../../store/gameStore'
import { getSpaceById } from '../../data/spaces'
import { PROPERTY_GROUPS } from '../../data/properties'
import styles from './RailwayModal.module.css'

interface RailwayModalProps {
  spaceId: number
  payerId: string
  onClose: () => void
}

export function RailwayModal ({ spaceId, payerId, onClose }: RailwayModalProps) {
  const players = useGameStore((state) => state.players)
  const properties = useGameStore((state) => state.properties)
  const updatePlayer = useGameStore((state) => state.updatePlayer)
  const addLogEntry = useGameStore((state) => state.addLogEntry)
  const setPendingAction = useGameStore((state) => state.setPendingAction)
  const setTurnPhase = useGameStore((state) => state.setTurnPhase)

  const space = getSpaceById(spaceId)
  const property = properties.find((p) => p.spaceId === spaceId)
  const payer = players.find((p) => p.id === payerId)
  const controller = property?.custodianId
    ? players.find((p) => p.id === property.custodianId)
    : null

  if ((space == null) || (property == null) || (payer == null) || (controller == null)) {
    return null
  }

  // Calculate how many railway stations the controller owns
  const railwaySpaces = PROPERTY_GROUPS.railroad.properties
  const controlledStations = railwaySpaces.filter((railwayId) => {
    const railwayProperty = properties.find((p) => p.spaceId === railwayId)
    return railwayProperty?.custodianId === controller.id
  }).length

  // Fee based on number of stations owned: 1=₽50, 2=₽100, 3=₽150, 4=₽200
  const fees = [50, 100, 150, 200]
  const fee = fees[controlledStations - 1] || 0

  const canAfford = payer.rubles >= fee
  const ownsAllFour = controlledStations === 4

  const handlePay = () => {
    if (!canAfford) {
      // Trigger liquidation modal
      setPendingAction({
        type: 'liquidation-required',
        data: {
          playerId: payerId,
          amountOwed: fee,
          creditorId: controller.id,
          reason: `Railway fee for ${space.name}`
        }
      })
    } else {
      // Transfer rubles
      updatePlayer(payerId, { rubles: payer.rubles - fee })
      updatePlayer(controller.id, { rubles: controller.rubles + fee })

      addLogEntry({
        type: 'payment',
        message: `${payer.name} paid ₽${String(fee)} railway fee to ${controller.name} (${String(controlledStations)} station${controlledStations > 1 ? 's' : ''})`,
        playerId: payerId
      })

      setPendingAction(null)
      setTurnPhase('post-turn')
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.header}>
          <span className={styles.icon}>🚂</span>
          <h2 className={styles.title}>TRANS-SIBERIAN RAILWAY</h2>
          <span className={styles.icon}>🚂</span>
        </div>

        <div className={styles.content}>
          <div className={styles.stationInfo}>
            <h3 className={styles.stationName}>{space.name}</h3>
            <div className={styles.controller}>
              <span className={styles.label}>Controlled by:</span>
              <span className={styles.value}>{controller.name}</span>
            </div>
          </div>

          <div className={styles.feeCalculation}>
            <div className={styles.stationsOwned}>
              <span className={styles.label}>Stations Controlled:</span>
              <span className={styles.value}>{controlledStations} of 4</span>
            </div>

            <div className={styles.feeStructure}>
              <h4 className={styles.feeTitle}>Railway Fee Structure:</h4>
              <div className={styles.feeList}>
                <div className={`${styles.feeItem} ${controlledStations === 1 ? styles.current : ''}`}>
                  1 Station: ₽50
                </div>
                <div className={`${styles.feeItem} ${controlledStations === 2 ? styles.current : ''}`}>
                  2 Stations: ₽100
                </div>
                <div className={`${styles.feeItem} ${controlledStations === 3 ? styles.current : ''}`}>
                  3 Stations: ₽150
                </div>
                <div className={`${styles.feeItem} ${controlledStations === 4 ? styles.current : ''}`}>
                  4 Stations: ₽200
                </div>
              </div>
            </div>
          </div>

          {ownsAllFour && !controller.usedRailwayGulagPower && (
            <div className={styles.specialRule}>
              <strong>⚠ ALL STATIONS CONTROLLED:</strong>
              <p>
                {controller.name} controls all Trans-Siberian Railway stations!
                They may send ONE player to the Gulag this game for &quot;attempting to flee the motherland.&quot;
              </p>
              <p className={styles.stalinNote}>
                (This power is exercised through Stalin&apos;s control panel)
              </p>
            </div>
          )}

          <div className={styles.feeDue}>
            <span className={styles.feeLabel}>Travel Fee Due:</span>
            <span className={styles.feeValue}>₽{fee}</span>
          </div>

          <div className={styles.payerBalance}>
            <span className={styles.balanceLabel}>Your Balance:</span>
            <span className={`${styles.balanceValue} ${!canAfford ? styles.insufficient : ''}`}>
              ₽{payer.rubles}
            </span>
          </div>

          {!canAfford && (
            <div className={styles.insufficientFunds}>
              <strong>⚠ INSUFFICIENT FUNDS</strong>
              <p>You do not have enough rubles to pay this railway fee.</p>
              <p>(Debt handling will be implemented in Milestone 5)</p>
            </div>
          )}

          <button
            className={styles.payButton}
            onClick={handlePay}
          >
            {canAfford ? `PAY ₽${String(fee)}` : 'ACKNOWLEDGE DEBT'}
          </button>
        </div>
      </div>
    </div>
  )
}
