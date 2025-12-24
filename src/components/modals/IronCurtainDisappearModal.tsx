import { useGameStore } from '../../store/gameStore'
import { getSpaceById } from '../../data/spaces'
import styles from './IronCurtainDisappearModal.module.css'

interface IronCurtainDisappearModalProps {
  ironCurtainPlayerId: string
  onClose: () => void
}

export function IronCurtainDisappearModal ({ ironCurtainPlayerId, onClose }: IronCurtainDisappearModalProps) {
  const players = useGameStore((state) => state.players)
  const properties = useGameStore((state) => state.properties)
  const ironCurtainDisappear = useGameStore((state) => state.ironCurtainDisappear)

  const ironCurtainPlayer = players.find((p) => p.id === ironCurtainPlayerId)

  if (!ironCurtainPlayer) {
    return null
  }

  // Get all properties owned by other players (including State)
  const disappearableProperties = properties
    .filter((prop) => {
      // Can disappear properties owned by other players or the State
      return prop.custodianId !== ironCurtainPlayerId
    })
    .map((prop) => {
      const space = getSpaceById(prop.spaceId)
      const owner = prop.custodianId
        ? players.find((p) => p.id === prop.custodianId)
        : null
      return {
        property: prop,
        space,
        owner: owner ?? { name: 'The State', id: 'state' }
      }
    })
    .filter((item) => item.space)

  const handleDisappear = (propertyId: number) => {
    ironCurtainDisappear(ironCurtainPlayerId, propertyId)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.header}>
          <span className={styles.icon}>🚧</span>
          <h2 className={styles.title}>IRON CURTAIN: DISAPPEAR</h2>
          <span className={styles.icon}>🚧</span>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            <strong>{ironCurtainPlayer.name}</strong>, your Iron Curtain allows you to make one property
            completely disappear, returning it to State ownership. This ability can only be used{' '}
            <strong>once per game</strong>.
          </p>

          <p className={styles.warning}>
            ⚠️ This action is permanent and cannot be undone!
          </p>

          {disappearableProperties.length === 0 ? (
            <div className={styles.noProperties}>
              <p>❌ No properties available to disappear</p>
              <p className={styles.hint}>All properties are owned by you or none exist</p>
            </div>
          ) : (
            <>
              <h3 className={styles.sectionTitle}>Select a property to disappear:</h3>
              <div className={styles.propertyList}>
                {disappearableProperties.map(({ property, space, owner }) => (
                  <button
                    key={property.spaceId}
                    className={styles.propertyButton}
                    onClick={() => { handleDisappear(property.spaceId) }}
                  >
                    <div className={styles.propertyInfo}>
                      <div className={styles.propertyName}>{space?.name}</div>
                      <div className={styles.propertyDetails}>
                        <span className={styles.owner}>
                          Owner: {owner.name}
                        </span>
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
