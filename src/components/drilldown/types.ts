import { ReactNode } from 'react';

export interface DrilldownSourceItem {
  [key: string]: string | number | boolean | null | undefined;
}

export interface DrilldownColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'percent' | 'number' | 'date' | 'status';
}

export interface DrilldownConfig {
  metricId: string;
  title: string;
  hasSource: boolean;
  sourceDescription?: string;
  calculation?: string;
  component?: ReactNode;
}

export interface DrilldownContextType {
  isOpen: boolean;
  config: DrilldownConfig | null;
  openDrilldown: (config: DrilldownConfig) => void;
  closeDrilldown: () => void;
}

export interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DrilldownConfig | null;
}
