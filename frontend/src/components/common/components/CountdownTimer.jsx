import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

const CountdownTimer = ({
  endDate,
  onExpired,
  showLabels = true,
  size = 'medium',
  showEndIn = false,
  originalPrice = null,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        if (onExpired) {
          onExpired();
        }
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpired]);

  useEffect(() => {
    if (isExpired) {
      // Notify parent component
      if (onExpired) {
        onExpired();
      }

      // Trigger a flash sale refresh through context/redux
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('flashSaleExpired'));
      }
    }
  }, [isExpired, onExpired]);

  if (isExpired) {
    return (
      <div className={`countdown-timer countdown-expired countdown-${size}`}>
        <span className="expired-text">Expired</span>
      </div>
    );
  }

  const sizeClass = `countdown-${size}`;
  const showDays = timeLeft.days > 0;

  return (
    <div className={`countdown-timer ${sizeClass} ${showEndIn ? 'countdown-with-endin' : ''}`}>
      {showEndIn && <span className="end-in-text">END IN</span>}

      {showDays && (
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.days.toString().padStart(2, '0')}</span>
          {showLabels && <span className="countdown-label">Day</span>}
        </div>
      )}

      <div className="countdown-item">
        <span className="countdown-number">{timeLeft.hours.toString().padStart(2, '0')}</span>
        {showLabels && <span className="countdown-label">Hour</span>}
      </div>

      <div className="countdown-item">
        <span className="countdown-number">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        {showLabels && <span className="countdown-label">Time</span>}
      </div>

      <div className="countdown-item">
        <span className="countdown-number">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        {showLabels && <span className="countdown-label">Second</span>}
      </div>

      {originalPrice && (
        <div className="after-price-info">
          <span className="after-price-text">After price:</span>
          <span className="after-price-value">{originalPrice.toLocaleString()}₫</span>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
