// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../../store/gameStore'
import { getSpaceById } from '../../data/spaces'
import styles from './SickleHarvestModal.module.css'

interface SickleHarvestModalProps {
  sicklePlayerId: string
  onClose: () => void
}

export function SickleHarvestModal ({ sicklePlayerId, onClose }: SickleHarvestModalProps) {
  const players = useGameStore((state) => state.players)
  const properties = useGameStore((state) => state.properties)
  const sickleHarvest = useGameStore((state) => state.sickleHarvest)

  const sicklePlayer = players.find((p) => p.id === sicklePlayerId)

  if (!sicklePlayer) {
    return null
  }

  // Get all properties owned by other players that are worth less than ₽150
  const harvestableProperties = properties
    .filter((prop) => {
      if (!prop.custodianId || prop.custodianId === sicklePlayerId) return false

      const space = getSpaceById(prop.spaceId)
      if (!space?.baseCost) return false

      // Must be less than ₽150
      return space.baseCost < 150
    })
    .map((prop) => {
      const space = getSpaceById(prop.spaceId)
      const owner = players.find((p) => p.id === prop.custodianId)
      return {
        property: prop,
        space,
        owner
      }
    })
    .filter((item) => item.space && item.owner)

  const handleHarvest = (propertyId: number) => {
    sickleHarvest(sicklePlayerId, propertyId)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.header}>
          <span className={styles.icon}>🌾</span>
          <h2 className={styles.title}>SICKLE HARVEST</h2>
          <span className={styles.icon}>🌾</span>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            <strong>{sicklePlayer.name}</strong>, your Sickle allows you to harvest (steal) one property
            worth less than ₽150. This ability can only be used <strong>once per game</strong>.
          </p>

          {harvestableProperties.length === 0 ? (
            <div className={styles.noProperties}>
              <p>❌ No harvestable properties available</p>
              <p className={styles.hint}>Properties must be owned by another player and worth less than ₽150</p>
            </div>
          ) : (
            <>
              <h3 className={styles.sectionTitle}>Select a property to harvest:</h3>
              <div className={styles.propertyList}>
                {harvestableProperties.map(({ property, space, owner }) => (
                  <button
                    key={property.spaceId}
                    className={styles.propertyButton}
                    onClick={() => { handleHarvest(property.spaceId) }}
                  >
                    <div className={styles.propertyInfo}>
                      <div className={styles.propertyName}>{space?.name}</div>
                      <div className={styles.propertyDetails}>
                        <span className={styles.owner}>Owner: {owner?.name}</span>
                        <span className={styles.value}>₽{space?.baseCost}</span>
                      </div>
                      {property.collectivizationLevel > 0 && (
                        <div className={styles.improvements}>
                          Collectivization Level: {property.collectivizationLevel}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button className={styles.buttonCancel} onClick={onClose}>
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
