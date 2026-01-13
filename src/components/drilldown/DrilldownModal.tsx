import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { DrilldownModalProps } from './types';
import { NoSourceMessage } from './NoSourceMessage';
import { Info } from 'lucide-react';

export function DrilldownModal({ isOpen, onClose, config }: DrilldownModalProps) {
  const isMobile = useIsMobile();

  if (!config) return null;

  const content = (
    <div className="space-y-4">
      {config.calculation && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Calculation</div>
            <code className="text-xs">{config.calculation}</code>
          </div>
        </div>
      )}
      
      {config.sourceDescription && (
        <p className="text-sm text-muted-foreground">{config.sourceDescription}</p>
      )}

      {config.hasSource && config.component ? (
        config.component
      ) : !config.hasSource ? (
        <NoSourceMessage metricName={config.title} />
      ) : null}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{config.title}</DrawerTitle>
            <DrawerDescription>Drill-down details</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>Drill-down details</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
