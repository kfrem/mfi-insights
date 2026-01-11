import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'elevated';
  format?: 'currency' | 'percent' | 'number';
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  format = 'number',
}: KPICardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-GH', {
          style: 'currency',
          currency: 'GHS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-GH').format(val);
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn(
      variant === 'elevated' ? 'kpi-card-elevated' : 'kpi-card',
      'animate-fade-in'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className={cn(
            'text-xs md:text-sm font-medium truncate',
            variant === 'elevated' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-lg md:text-2xl font-semibold tracking-tight truncate',
            variant === 'elevated' ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs truncate',
              variant === 'elevated' ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'p-1.5 md:p-2 rounded-lg shrink-0',
            variant === 'elevated' 
              ? 'bg-white/10' 
              : 'bg-muted'
          )}>
            {icon}
          </div>
        )}
      </div>
      
      {trend && trendValue && (
        <div className="mt-3 md:mt-4 flex items-center gap-1.5">
          <TrendIcon className={cn(
            'h-3.5 w-3.5 md:h-4 md:w-4 shrink-0',
            trend === 'up' && 'text-status-current',
            trend === 'down' && 'text-status-loss',
            trend === 'neutral' && 'text-muted-foreground'
          )} />
          <span className={cn(
            'text-xs font-medium truncate',
            variant === 'elevated' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
