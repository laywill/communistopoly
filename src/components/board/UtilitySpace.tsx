import { BoardSpace } from '../../types/game';
import styles from './UtilitySpace.module.css';

interface UtilitySpaceProps {
  space: BoardSpace;
}

const UtilitySpace = ({ space }: UtilitySpaceProps) => {
  const isElectric = space.id === 12;
  const icon = isElectric ? '⚡' : '💧';

  return (
    <div className={styles.utility}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.label}>MEANS OF<br/>PRODUCTION</div>
      <div className={styles.name}>{space.name}</div>
      <div className={styles.cost}>₽{space.baseCost}</div>
      {/* <div className={styles.requirements}>
        <div>COMMISSAR+</div>
        <div>RANK ONLY</div>
      </div>
      <div className={styles.rates}>
        <div>1 utility: 4× dice</div>
        <div>Both: 10× dice</div>
      </div> */}
    </div>
  );
};

export default UtilitySpace;
