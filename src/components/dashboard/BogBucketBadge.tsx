import { cn } from '@/lib/utils';

interface BogBucketBadgeProps {
  bucket: string;
}

const bucketStyles: Record<string, string> = {
  'Current': 'status-current',
  'Watch': 'status-watch',
  'Substandard': 'status-substandard',
  'Doubtful': 'status-doubtful',
  'Loss': 'status-loss',
};

export function BogBucketBadge({ bucket }: BogBucketBadgeProps) {
  const styleClass = bucketStyles[bucket] || 'status-current';
  
  return (
    <span className={cn('status-badge', styleClass)}>
      {bucket}
    </span>
  );
}
