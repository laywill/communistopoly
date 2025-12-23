import React, { useState } from 'react';
import styles from './StalinPriceSetter.module.css';

interface StalinPriceSetterProps {
  baseValue: number;
  minMultiplier?: number;
  maxMultiplier?: number;
  onPriceSet: (price: number) => void;
  disabled?: boolean;
}

export function StalinPriceSetter({
  baseValue,
  minMultiplier = 0.5,
  maxMultiplier = 2.0,
  onPriceSet,
  disabled = false,
}: StalinPriceSetterProps) {
  const minPrice = Math.floor(baseValue * minMultiplier);
  const maxPrice = Math.floor(baseValue * maxMultiplier);
  const [inputValue, setInputValue] = useState(baseValue.toString());
  const [error, setError] = useState<string | null>(null);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setError('Invalid price');
      return;
    }

    if (numValue < minPrice || numValue > maxPrice) {
      setError(`Price must be between ₽${minPrice} and ₽${maxPrice}`);
    } else {
      setError(null);
    }
  };

  const handleSubmit = () => {
    const price = parseInt(inputValue);
    if (!isNaN(price) && price >= minPrice && price <= maxPrice) {
      onPriceSet(price);
    }
  };

  const isValid = !error && !isNaN(parseInt(inputValue));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>☭</span>
        <h3 className={styles.title}>STALIN SETS THE PRICE</h3>
        <span className={styles.icon}>☭</span>
      </div>

      <div className={styles.baseValue}>
        <span className={styles.label}>Base Value:</span>
        <span className={styles.value}>₽{baseValue}</span>
      </div>

      <div className={styles.range}>
        <span className={styles.label}>Valid Range:</span>
        <span className={styles.value}>₽{minPrice} - ₽{maxPrice}</span>
      </div>

      <div className={styles.inputContainer}>
        <label htmlFor="stalin-price" className={styles.inputLabel}>
          Set Price (₽):
        </label>
        <input
          id="stalin-price"
          type="number"
          min={minPrice}
          max={maxPrice}
          value={inputValue}
          onChange={handlePriceChange}
          className={styles.input}
          disabled={disabled}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        className={styles.confirmButton}
        onClick={handleSubmit}
        disabled={disabled || !isValid}
      >
        DECREE THE PRICE
      </button>

      <div className={styles.note}>
        &quot;The State generously offers this property to the workers...&quot;
      </div>
    </div>
  );
}
