import { useState, useEffect } from 'react';

export function useTabTransition(activeTab: string) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayTab, setDisplayTab] = useState(activeTab);

  useEffect(() => {
    if (activeTab !== displayTab) {
      setIsTransitioning(true);

      const fadeOutTimer = setTimeout(() => {
        setDisplayTab(activeTab);
      }, 150);

      const fadeInTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 200);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(fadeInTimer);
      };
    }
  }, [activeTab, displayTab]);

  return { displayTab, isTransitioning };
}
