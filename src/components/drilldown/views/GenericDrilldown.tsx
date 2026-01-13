import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface GenericDrilldownProps {
  calculation?: string;
  sourceDescription?: string;
}

export function GenericDrilldown({ calculation, sourceDescription }: GenericDrilldownProps) {
  return (
    <div className="space-y-4">
      {calculation && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-sm mb-1">Calculation Formula</div>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {calculation}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {sourceDescription && (
        <div className="text-sm text-muted-foreground">
          {sourceDescription}
        </div>
      )}

      <div className="text-center py-6 text-muted-foreground">
        <p>This metric is calculated from aggregated data.</p>
        <p className="text-xs mt-2">For detailed breakdowns, see the related reports.</p>
      </div>
    </div>
  );
}
