import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NoSourceMessageProps {
  metricName?: string;
  reason?: string;
}

export function NoSourceMessage({ metricName, reason }: NoSourceMessageProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <div>
            <h4 className="font-medium text-foreground">
              No Source Data Available
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {reason || `The ${metricName || 'metric'} is a calculated or derived value without direct source records.`}
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm">
            This figure may be derived from multiple data sources, external systems, or calculated using formulas. 
            Contact your administrator for detailed methodology.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
