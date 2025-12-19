import { BoardSpace } from '../../types/game';
import styles from './RailwaySpace.module.css';

interface RailwaySpaceProps {
  space: BoardSpace;
}

const RailwaySpace = ({ space }: RailwaySpaceProps) => {
  return (
    <div className={styles.railway}>
      <div className={styles.icon}>🚂</div>
      <div className={styles.name}>{space.name}</div>
      <div className={styles.label}>RAILWAY STATION</div>
      <div className={styles.cost}>₽{space.baseCost}</div>
    </div>
  );
};

export default RailwaySpace;
