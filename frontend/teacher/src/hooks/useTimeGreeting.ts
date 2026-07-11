// src/hooks/useTimeGreeting.ts
import { useState, useEffect } from 'react';

export const useTimeGreeting = () => {
  const [greeting, setGreeting] = useState('');
//   const [timeEmoji, setTimeEmoji] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };
    
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return { greeting };
};
