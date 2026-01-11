import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { Shield } from 'lucide-react';

export default function AuditLog() {
  return (
    <div className="p-8">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <div>
            <h1 className="page-title">Audit Trail & Governance</h1>
            <p className="page-subtitle">Complete activity audit log for compliance and governance</p>
          </div>
        </div>
      </header>

      <div className="mt-6">
        <AuditLogViewer />
      </div>
    </div>
  );
}
