import { useEffect, useState } from 'react';

export default function useCountUp(targetNumber, duration = 1500, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTimestamp = null;
    let frameId;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Quadratic ease out
      const easeProgress = progress * (2 - progress);
      
      setCount(Math.floor(easeProgress * targetNumber));
      
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      } else {
        setCount(targetNumber);
      }
    };

    frameId = window.requestAnimationFrame(step);
    
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [targetNumber, duration, start]);

  return count;
}
