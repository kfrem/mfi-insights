import { createContext, useContext, useState, ReactNode } from 'react';
import { DrilldownConfig, DrilldownContextType } from './types';

const DrilldownContext = createContext<DrilldownContextType | undefined>(undefined);

export function DrilldownProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DrilldownConfig | null>(null);

  const openDrilldown = (newConfig: DrilldownConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const closeDrilldown = () => {
    setIsOpen(false);
    setConfig(null);
  };

  return (
    <DrilldownContext.Provider value={{ isOpen, config, openDrilldown, closeDrilldown }}>
      {children}
    </DrilldownContext.Provider>
  );
}

export function useDrilldown() {
  const context = useContext(DrilldownContext);
  if (!context) {
    throw new Error('useDrilldown must be used within a DrilldownProvider');
  }
  return context;
}
