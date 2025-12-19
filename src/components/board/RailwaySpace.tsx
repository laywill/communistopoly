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
      <div className={styles.label}>RAILWAY</div>
      <div className={styles.cost}>₽{space.baseCost}</div>
      <div className={styles.rates}>
        <div>1 station: ₽50</div>
        <div>2 stations: ₽100</div>
        <div>3 stations: ₽150</div>
        <div>4 stations: ₽200</div>
      </div>
    </div>
  );
};

export default RailwaySpace;
