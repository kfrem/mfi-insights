import { useOrganisationDetails } from '@/hooks/useOrganisationDetails';
import { Building2 } from 'lucide-react';

interface ReportHeaderProps {
  reportTitle: string;
  reportDate?: string;
  showContactInfo?: boolean;
}

export function ReportHeader({ reportTitle, reportDate, showContactInfo = true }: ReportHeaderProps) {
  const { getReportHeader, isDemo } = useOrganisationDetails();
  const header = getReportHeader();

  if (!header) {
    return (
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{reportTitle}</h1>
        {reportDate && <p className="text-muted-foreground">{reportDate}</p>}
      </div>
    );
  }

  return (
    <div className="mb-8 print:mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {header.logoUrl ? (
            <img 
              src={header.logoUrl} 
              alt={header.name} 
              className="h-16 w-16 object-contain"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{header.name}</h1>
            {header.tradingName && header.tradingName !== header.name && (
              <p className="text-muted-foreground text-sm">Trading as: {header.tradingName}</p>
            )}
            {isDemo && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Demo Organisation
              </span>
            )}
          </div>
        </div>

        {showContactInfo && (
          <div className="text-right text-sm text-muted-foreground">
            {header.fullAddress && <p>{header.fullAddress}</p>}
            {header.phone && <p>Tel: {header.phone}</p>}
            {header.email && <p>{header.email}</p>}
            {header.registrationNumber && <p>Reg: {header.registrationNumber}</p>}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <h2 className="text-lg font-semibold text-center">{reportTitle}</h2>
        {reportDate && (
          <p className="text-center text-muted-foreground text-sm">{reportDate}</p>
        )}
      </div>
    </div>
  );
}
