import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useDrilldown } from './DrilldownContext';
import { DrilldownConfig } from './types';

interface DrillableValueProps {
  children: ReactNode;
  config: DrilldownConfig;
  className?: string;
}

export function DrillableValue({ children, config, className }: DrillableValueProps) {
  const { openDrilldown } = useDrilldown();

  return (
    <button
      onClick={() => openDrilldown(config)}
      className={cn(
        'text-left cursor-pointer transition-all duration-200',
        'hover:text-primary hover:underline underline-offset-2',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded',
        className
      )}
      title="Click for details"
    >
      {children}
    </button>
  );
}
