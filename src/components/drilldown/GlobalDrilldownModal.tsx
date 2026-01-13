import { useDrilldown } from './DrilldownContext';
import { DrilldownModal } from './DrilldownModal';

export function GlobalDrilldownModal() {
  const { isOpen, config, closeDrilldown } = useDrilldown();

  return (
    <DrilldownModal
      isOpen={isOpen}
      onClose={closeDrilldown}
      config={config}
    />
  );
}
