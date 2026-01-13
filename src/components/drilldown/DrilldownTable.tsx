import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DrilldownColumn, DrilldownSourceItem } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DrilldownTableProps {
  columns: DrilldownColumn[];
  data: DrilldownSourceItem[];
}

const formatValue = (value: unknown, type?: DrilldownColumn['type']): string => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(value));
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'number':
      return new Intl.NumberFormat('en-GH').format(Number(value));
    case 'date':
      if (!value) return '-';
      try {
        return new Date(String(value)).toLocaleDateString('en-GH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return String(value);
      }
    default:
      return String(value);
  }
};

export function DrilldownTable({ columns, data }: DrilldownTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="text-xs">
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col.key} className="text-sm py-2">
                  {col.type === 'status' ? (
                    <Badge variant="outline" className="text-xs">
                      {String(row[col.key] ?? '-')}
                    </Badge>
                  ) : (
                    formatValue(row[col.key], col.type)
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
