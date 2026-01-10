import { useOrganisationSettings, useBogTierConfigs } from '@/hooks/useBogTiers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Landmark, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { BOG_TIER_LABELS } from '@/types/bogTiers';

interface TierComplianceWidgetProps {
  currentCAR?: number;
  currentLiquidity?: number;
  compact?: boolean;
}

export function TierComplianceWidget({ 
  currentCAR = 0, 
  currentLiquidity = 0,
  compact = false 
}: TierComplianceWidgetProps) {
  const { data: settings } = useOrganisationSettings();
  const { data: tierConfigs } = useBogTierConfigs();

  if (!settings) {
    return null;
  }

  const tierConfig = tierConfigs?.find(t => t.tier === settings.bog_tier);
  const tierLabel = BOG_TIER_LABELS[settings.bog_tier];

  const carThreshold = settings.car_threshold || tierConfig?.car_requirement || 10;
  const liquidityThreshold = settings.liquidity_threshold || tierConfig?.liquidity_requirement || 15;

  const carCompliant = currentCAR >= carThreshold;
  const liquidityCompliant = currentLiquidity >= liquidityThreshold;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${tierLabel.color} text-white`}>
          {tierLabel.shortName}
        </Badge>
        <Badge variant={carCompliant ? 'default' : 'destructive'}>
          CAR: {currentCAR.toFixed(1)}%
        </Badge>
        <Badge variant={liquidityCompliant ? 'default' : 'destructive'}>
          LR: {currentLiquidity.toFixed(1)}%
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            BoG Tier Compliance
          </div>
          <Badge className={`${tierLabel.color} text-white`}>
            {tierLabel.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CAR Compliance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Capital Adequacy Ratio</span>
            <div className="flex items-center gap-2">
              {carCompliant ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className={carCompliant ? 'text-green-600' : 'text-destructive'}>
                {currentCAR.toFixed(1)}% / {carThreshold}%
              </span>
            </div>
          </div>
          <Progress 
            value={Math.min((currentCAR / carThreshold) * 100, 100)} 
            className={carCompliant ? '' : '[&>div]:bg-destructive'}
          />
        </div>

        {/* Liquidity Compliance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Liquidity Ratio</span>
            <div className="flex items-center gap-2">
              {liquidityCompliant ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className={liquidityCompliant ? 'text-green-600' : 'text-destructive'}>
                {currentLiquidity.toFixed(1)}% / {liquidityThreshold}%
              </span>
            </div>
          </div>
          <Progress 
            value={Math.min((currentLiquidity / liquidityThreshold) * 100, 100)} 
            className={liquidityCompliant ? '' : '[&>div]:bg-destructive'}
          />
        </div>

        {/* License Status */}
        {settings.license_number && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">License</span>
            <span className="font-mono">{settings.license_number}</span>
          </div>
        )}

        {/* Warnings */}
        {(!carCompliant || !liquidityCompliant) && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <span className="font-medium text-destructive">Compliance Alert:</span>
              <span className="text-destructive/80 ml-1">
                {!carCompliant && !liquidityCompliant 
                  ? 'CAR and Liquidity ratios below BoG requirements'
                  : !carCompliant 
                    ? 'CAR below BoG requirement'
                    : 'Liquidity ratio below BoG requirement'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}